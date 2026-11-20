import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createSeedState } from '../data/seed.js';
import { getUser } from '../data/users.js';
import { formatShort } from '../utils/dates.js';

const STORAGE_KEY = 'skillswap-demo-state';
const STATE_VERSION = 1;

const AppContext = createContext(null);

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    // Storage may be unavailable (private mode) or corrupted; fall back to seed data.
  }
  return createSeedState();
}

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [toasts, setToasts] = useState([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist every change so the demo survives page reloads.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota / privacy errors – the app still works in memory.
    }
  }, [state]);

  const notify = useCallback((text, tone = 'success') => {
    setToasts((list) => [...list, { id: uid(), text, tone }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const update = useCallback((fn) => setState((prev) => ({ ...prev, ...fn(prev) })), []);

  const toggleIn = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const addNotification = (prev, text, link, type = 'info') => [
    { id: uid(), type, text, link, createdAt: Date.now(), read: false },
    ...prev.notifications,
  ];

  const ensureConversation = (prev, userId) =>
    prev.conversations[userId] ? prev.conversations : { ...prev.conversations, [userId]: [] };

  const actions = useMemo(() => {
    const api = {
      updateProfile(patch) {
        update((prev) => ({ profile: { ...prev.profile, ...patch } }));
      },

      toggleFavorite(userId) {
        const user = getUser(userId);
        const adding = !stateRef.current.favorites.includes(userId);
        update((prev) => ({ favorites: toggleIn(prev.favorites, userId) }));
        notify(adding ? `${user.name} saved to favorites` : `${user.name} removed from favorites`, 'info');
      },

      sendRequest(userId) {
        // They already asked you: requesting back simply connects you.
        if (stateRef.current.incomingRequests.some((r) => r.userId === userId)) {
          api.acceptRequest(userId);
          return;
        }
        const user = getUser(userId);
        update((prev) => {
          if (prev.sentRequests.includes(userId)) return {};
          return {
            sentRequests: [...prev.sentRequests, userId],
            notifications: addNotification(prev, `Swap request sent to ${user.name}.`, `/profile/${userId}`, 'request'),
          };
        });
        notify(`Swap request sent to ${user.name}`);
      },

      cancelRequest(userId) {
        update((prev) => ({ sentRequests: prev.sentRequests.filter((x) => x !== userId) }));
        notify('Request withdrawn', 'info');
      },

      acceptRequest(userId) {
        const user = getUser(userId);
        update((prev) => {
          const conversations = ensureConversation(prev, userId);
          return {
            incomingRequests: prev.incomingRequests.filter((r) => r.userId !== userId),
            sentRequests: prev.sentRequests.filter((x) => x !== userId),
            connections: prev.connections.some((c) => c.userId === userId)
              ? prev.connections
              : [...prev.connections, { userId, kind: 'exchange', total: 8, goal: `Learn ${user.wants.map((w) => w.name).join(', ')}.` }],
            conversations: {
              ...conversations,
              [userId]: [
                ...conversations[userId],
                { id: uid(), from: 'system', type: 'text', text: `You're connected · ${user.teaches[0].name} ⇄ ${user.wants[0].name}`, at: Date.now() },
              ],
            },
            notifications: addNotification(prev, `You and ${user.name} are now connected.`, `/messages/${userId}`, 'match'),
          };
        });
        notify(`You and ${user.name} are now connected`);
      },

      declineRequest(userId) {
        update((prev) => ({ incomingRequests: prev.incomingRequests.filter((r) => r.userId !== userId) }));
        notify('Request declined', 'info');
      },

      blockUser(userId) {
        const user = getUser(userId);
        update((prev) => ({
          blocked: prev.blocked.includes(userId) ? prev.blocked : [...prev.blocked, userId],
          favorites: prev.favorites.filter((x) => x !== userId),
          sentRequests: prev.sentRequests.filter((x) => x !== userId),
          incomingRequests: prev.incomingRequests.filter((r) => r.userId !== userId),
        }));
        notify(`You blocked ${user.name}. They can't message you or see your profile.`, 'warning');
      },

      unblockUser(userId) {
        update((prev) => ({ blocked: prev.blocked.filter((x) => x !== userId) }));
        notify('User unblocked', 'info');
      },

      reportUser(userId, reason) {
        update((prev) => ({ reported: [...prev.reported, { userId, reason, at: Date.now() }] }));
        notify('Thanks — our safety team will review this report within 24 hours.', 'warning');
      },

      startConversation(userId) {
        update((prev) => ({ conversations: ensureConversation(prev, userId) }));
      },

      sendMessage(userId, message) {
        update((prev) => {
          const conversations = ensureConversation(prev, userId);
          return {
            conversations: {
              ...conversations,
              [userId]: [...conversations[userId], { id: uid(), from: 'me', at: Date.now(), ...message }],
            },
          };
        });
      },

      receiveMessage(userId, message) {
        update((prev) => {
          const conversations = ensureConversation(prev, userId);
          return {
            conversations: {
              ...conversations,
              [userId]: [...conversations[userId], { id: uid(), from: 'them', at: Date.now(), ...message }],
            },
          };
        });
      },

      markConversationRead(userId) {
        update((prev) => {
          if (!prev.unread[userId]) return {};
          const unread = { ...prev.unread };
          delete unread[userId];
          return { unread };
        });
      },

      respondToProposal(userId, messageId, status) {
        update((prev) => {
          const thread = prev.conversations[userId] || [];
          const msg = thread.find((m) => m.id === messageId);
          if (!msg) return {};
          const proposal = { ...msg.proposal, status };
          const nextThread = thread.map((m) => (m.id === messageId ? { ...m, proposal } : m));
          let sessions = prev.sessions;
          if (status === 'accepted' && !sessions.some((s) => s.partnerId === userId && s.date === proposal.date && s.time === proposal.time)) {
            sessions = [
              ...sessions,
              { id: uid(), partnerId: userId, focus: proposal.focus, date: proposal.date, time: proposal.time, duration: proposal.duration, mode: proposal.mode, place: '', note: '', status: 'upcoming' },
            ];
          }
          return { conversations: { ...prev.conversations, [userId]: nextThread }, sessions };
        });
        notify(status === 'accepted' ? 'Session added to both calendars' : 'Proposal declined', status === 'accepted' ? 'success' : 'info');
      },

      scheduleSession(session) {
        const user = getUser(session.partnerId);
        update((prev) => {
          const conversations = ensureConversation(prev, session.partnerId);
          return {
            sessions: [...prev.sessions, { ...session, id: uid(), status: 'upcoming' }],
            conversations: {
              ...conversations,
              [session.partnerId]: [
                ...conversations[session.partnerId],
                {
                  id: uid(),
                  from: 'me',
                  type: 'proposal',
                  at: Date.now(),
                  proposal: { date: session.date, time: session.time, duration: session.duration, mode: session.mode, focus: session.focus, status: 'accepted' },
                },
              ],
            },
            notifications: addNotification(prev, `Session with ${user.name} booked for ${formatShort(session.date)} at ${session.time}.`, '/sessions', 'reminder'),
          };
        });
        notify(`Session with ${user.name} scheduled`);
      },

      completeSession(sessionId) {
        update((prev) => ({ sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, status: 'completed', review: null } : s)) }));
        notify('Session marked as completed. Leave a review!');
      },

      cancelSession(sessionId) {
        update((prev) => ({ sessions: prev.sessions.filter((s) => s.id !== sessionId) }));
        notify('Session cancelled', 'info');
      },

      reviewSession(sessionId, review) {
        update((prev) => ({ sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, review } : s)) }));
        notify('Thanks for your review!');
      },

      markNotificationRead(id) {
        update((prev) => ({ notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
      },

      markAllNotificationsRead() {
        update((prev) => ({ notifications: prev.notifications.map((n) => ({ ...n, read: true })) }));
      },

      addPost(post) {
        update((prev) => ({ posts: [{ id: uid(), createdAt: Date.now(), likes: 0, replies: [], ...post }, ...prev.posts] }));
        notify('Your post is live');
      },

      toggleLike(postId) {
        update((prev) => ({ likedPosts: toggleIn(prev.likedPosts, postId) }));
      },

      addReply(postId, reply) {
        update((prev) => ({ posts: prev.posts.map((p) => (p.id === postId ? { ...p, replies: [...p.replies, reply] } : p)) }));
      },

      hidePost(postId) {
        update((prev) => ({ hiddenPosts: [...prev.hiddenPosts, postId] }));
        notify('Post reported and hidden from your feed', 'warning');
      },

      toggleChallenge() {
        const joining = !stateRef.current.challengeJoined;
        update(() => ({ challengeJoined: joining }));
        notify(joining ? "You're in! Post your micro-lesson by the end of the month." : 'You left the challenge', joining ? 'success' : 'info');
      },

      resetDemo() {
        setState(createSeedState());
        notify('Demo data reset', 'info');
      },
    };
    return api;
  }, [update, notify]);

  const value = useMemo(() => ({ state, ...actions, notify, toasts, dismissToast }), [state, actions, notify, toasts, dismissToast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
