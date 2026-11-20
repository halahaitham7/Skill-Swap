import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import ReportDialog from '../components/ReportDialog.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { getUser } from '../data/users.js';
import { clockTime, formatLong, relativeTime } from '../utils/dates.js';
import { sessionsWithPartner } from '../utils/progress.js';
import './Messages.css';

const QUICK_REPLIES = ['Sounds great, see you then!', 'Can we move it 30 minutes later?', 'Here’s what I want to cover next time:'];

const AUTO_REPLIES = [
  'Sounds good to me!',
  'Great idea — let’s do that.',
  'Thanks for sharing! I’ll take a look before our session.',
  'Perfect. I’ll prepare a few exercises.',
  'Haha, yes! Talk soon.',
];

function previewOf(message) {
  if (!message) return 'Say hi to your new match';
  if (message.type === 'resource') return `Shared a file: ${message.fileName}`;
  if (message.type === 'proposal') return 'Session proposal';
  return message.text;
}

function formatSize(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function MessageItem({ message, user, onRespond }) {
  if (message.from === 'system') return <div className="system-msg">{message.text}</div>;
  const mine = message.from === 'me';
  const meta = `${mine ? '' : `${user.name.split(' ')[0]} · `}${clockTime(message.at)}`;

  let content;
  if (message.type === 'resource') {
    content = (
      <div className="resource-bubble">
        <span className="resource-icon">
          <Icon name="file" size={22} />
        </span>
        <span className="stack" style={{ gap: 0 }}>
          <strong className="small">{message.fileName}</strong>
          <span className="muted tiny">Shared resource · {message.size}</span>
        </span>
      </div>
    );
  } else if (message.type === 'proposal') {
    const p = message.proposal;
    content = (
      <div className="proposal">
        <span className="label-caps teach" style={{ fontSize: 12 }}>
          Session {mine ? 'booked' : 'proposal'}
        </span>
        <strong>
          {formatLong(p.date)} · {p.time}
        </strong>
        <span className="small" style={{ color: 'var(--ink-2)' }}>
          {p.mode === 'Online' ? 'Video call' : 'In person'} · {p.duration} min · {p.focus}
        </span>
        {!mine && p.status === 'open' && (
          <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
            <button type="button" className="btn btn-soft" style={{ flex: '1 1 0' }} onClick={() => onRespond(message.id, 'declined')}>
              Decline
            </button>
            <button type="button" className="btn btn-primary" style={{ flex: '1 1 0' }} onClick={() => onRespond(message.id, 'accepted')}>
              Accept
            </button>
          </div>
        )}
        {p.status === 'accepted' && <span className="notice success">✓ Added to both calendars</span>}
        {p.status === 'declined' && <span className="notice info">You declined this time</span>}
      </div>
    );
  } else {
    content = <div className="bubble">{message.text}</div>;
  }

  return (
    <div className={`msg ${mine ? 'me' : 'them'}`}>
      {content}
      <span className="meta">{meta}</span>
    </div>
  );
}

export default function Messages() {
  const { userId } = useParams();
  const { state, sendMessage, receiveMessage, markConversationRead, respondToProposal } = useApp();
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [dialog, setDialog] = useState(null);
  const bodyRef = useRef(null);
  const fileRef = useRef(null);
  const replyIndex = useRef(0);

  // All conversations (existing threads + connections), newest first, minus blocked members.
  const conversations = useMemo(() => {
    const ids = new Set([...Object.keys(state.conversations), ...state.connections.map((c) => c.userId)]);
    return [...ids]
      .filter((id) => getUser(id) && !state.blocked.includes(id))
      .map((id) => {
        const thread = state.conversations[id] || [];
        const last = [...thread].reverse().find((m) => m.from !== 'system');
        return { id, user: getUser(id), last, at: last ? last.at : 0 };
      })
      .sort((a, b) => b.at - a.at);
  }, [state.conversations, state.connections, state.blocked]);

  const activeId = userId && getUser(userId) && !state.blocked.includes(userId) ? userId : conversations[0]?.id;
  const user = activeId ? getUser(activeId) : null;
  const thread = useMemo(() => (activeId ? state.conversations[activeId] || [] : []), [state.conversations, activeId]);
  const connection = state.connections.find((c) => c.userId === activeId);

  useDocumentTitle(user ? `Messages with ${user.name}` : 'Messages');

  // Mark the open conversation as read.
  useEffect(() => {
    if (activeId) markConversationRead(activeId);
  }, [activeId, thread.length, markConversationRead]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length, typing, activeId]);

  // Simulate the partner replying shortly after you send a message.
  useEffect(() => {
    const last = thread[thread.length - 1];
    if (!activeId || !last || last.from !== 'me') {
      setTyping(false);
      return undefined;
    }
    setTyping(true);
    const timer = setTimeout(() => {
      const text = AUTO_REPLIES[replyIndex.current % AUTO_REPLIES.length];
      replyIndex.current += 1;
      receiveMessage(activeId, { type: 'text', text });
      setTyping(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [thread, activeId, receiveMessage]);

  const send = (text) => {
    const value = text.trim();
    if (!value || !activeId) return;
    sendMessage(activeId, { type: 'text', text: value });
    setDraft('');
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (file && activeId) sendMessage(activeId, { type: 'resource', fileName: file.name, size: formatSize(file.size) });
    e.target.value = '';
  };

  const filtered = conversations.filter((c) => c.user.name.toLowerCase().includes(search.trim().toLowerCase()));
  const resources = thread.filter((m) => m.type === 'resource');
  const myGoal = state.profile.learn[0];
  const done = activeId ? sessionsWithPartner(state, activeId) : 0;

  return (
    <div className="container messages-layout">
      {/* Conversation list */}
      <section className="convo-list" aria-label="Conversations">
        <h1 style={{ fontSize: 22, margin: '4px 8px 8px' }}>Messages</h1>
        <label className="input-icon" style={{ marginBottom: 6 }}>
          <Icon name="search" size={18} strokeWidth={2.2} />
          <span className="sr-only">Search conversations</span>
          <input className="input soft" style={{ fontSize: 15, padding: '11px 12px 11px 40px' }} type="search" placeholder="Search conversations" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        {filtered.length === 0 && <p className="muted small" style={{ padding: 8 }}>No conversations found.</p>}
        {filtered.map((c) => {
          const unread = state.unread[c.id];
          return (
            <Link key={c.id} to={`/messages/${c.id}`} className={`convo${c.id === activeId ? ' active' : ''}`} aria-current={c.id === activeId ? 'true' : undefined}>
              <Avatar name={c.user.name} palette={c.user.palette} size={46} online={c.id === 'john'} />
              <span className="stack" style={{ gap: 2, flex: '1 1 auto', minWidth: 0 }}>
                <span className="row-between" style={{ flexWrap: 'nowrap', gap: 8 }}>
                  <strong style={{ fontSize: 15 }}>{c.user.name}</strong>
                  <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {c.last ? relativeTime(c.last.at) : 'New match'}
                  </span>
                </span>
                <span className={`preview${unread ? ' unread' : ''}`}>{previewOf(c.last)}</span>
              </span>
              {unread > 0 && <span className="count-badge">{unread}</span>}
            </Link>
          );
        })}
        <Link to="/match" className="btn btn-tint" style={{ marginTop: 8 }}>
          <Icon name="plus" size={18} /> Find someone new
        </Link>
      </section>

      {user ? (
        <>
          {/* Thread */}
          <section className="thread" aria-label={`Conversation with ${user.name}`}>
            <div className="thread-head">
              <Link to={`/profile/${user.id}`} className="row" style={{ gap: 12, color: 'var(--ink)', textDecoration: 'none', flexWrap: 'nowrap' }}>
                <Avatar name={user.name} palette={user.palette} size={44} />
                <span className="stack" style={{ gap: 0 }}>
                  <strong style={{ fontSize: 16 }}>{user.name}</strong>
                  <span className="tiny" style={{ color: typing ? 'var(--purple-ink)' : 'var(--green)', fontWeight: 600 }}>
                    {typing ? 'typing…' : user.id === 'john' ? 'Online now' : user.responseTime}
                  </span>
                </span>
              </Link>
              <div className="row" style={{ gap: 8 }}>
                <Link to={`/sessions?with=${user.id}`} className="btn btn-tint">
                  <Icon name="calendar" size={18} /> Schedule
                </Link>
                <Link to={`/profile/${user.id}`} className="icon-btn soft" aria-label={`View ${user.name}'s profile`}>
                  <Icon name="userPlus" size={20} />
                </Link>
              </div>
            </div>

            <div className="thread-body" ref={bodyRef} aria-live="polite">
              {thread.length === 0 && (
                <div className="system-msg">
                  You haven&apos;t chatted with {user.name.split(' ')[0]} yet. Say hi and share your learning goals!
                </div>
              )}
              {thread.map((m) => (
                <MessageItem key={m.id} message={m} user={user} onRespond={(id, status) => respondToProposal(user.id, id, status)} />
              ))}
              {typing && (
                <div className="typing" aria-label={`${user.name} is typing`}>
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            <div className="thread-foot">
              <div className="row" style={{ gap: 8 }}>
                {QUICK_REPLIES.map((q) => (
                  <button key={q} type="button" className="quick-reply" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <form
                className="row"
                style={{ gap: 8, flexWrap: 'nowrap' }}
                onSubmit={(e) => {
                  e.preventDefault();
                  send(draft);
                }}
              >
                <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} onChange={onFile} aria-hidden="true" />
                <button type="button" className="icon-btn soft" aria-label="Share a file" onClick={() => fileRef.current?.click()}>
                  <Icon name="clip" size={20} />
                </button>
                <label style={{ flex: '1 1 auto', display: 'flex' }}>
                  <span className="sr-only">Message {user.name}</span>
                  <input className="input soft" style={{ fontSize: 15 }} type="text" placeholder="Write a message…" value={draft} onChange={(e) => setDraft(e.target.value)} />
                </label>
                <button type="submit" className="icon-btn" style={{ background: 'var(--purple)', color: '#fff' }} aria-label="Send message" disabled={!draft.trim()}>
                  <Icon name="send" size={20} />
                </button>
              </form>
            </div>
          </section>

          {/* Exchange details */}
          <aside className="thread-side">
            <section className="card stack" style={{ gap: 14, padding: 20 }}>
              <h2 style={{ fontSize: 17 }}>Learning goals</h2>
              {myGoal && (
                <div className="stack" style={{ background: 'var(--blue-tint-2)', borderRadius: 14, padding: 14, gap: 6 }}>
                  <span className="label-caps learn">You&apos;re learning · {myGoal.name}</span>
                  <span className="small">{myGoal.goal || `Reach ${myGoal.level === 'Beginner' ? 'intermediate' : 'advanced'} level.`}</span>
                </div>
              )}
              <div className="stack" style={{ background: 'var(--purple-tint-2)', borderRadius: 14, padding: 14, gap: 6 }}>
                <span className="label-caps teach">
                  {user.name.split(' ')[0]}&apos;s learning · {user.wants[0].name}
                </span>
                <span className="small">{connection?.goal || `Get started with ${user.wants[0].name.toLowerCase()}.`}</span>
              </div>
            </section>

            <section className="card stack" style={{ gap: 8, padding: 20 }}>
              <h2 style={{ fontSize: 17 }}>Shared resources</h2>
              {resources.length === 0 && <p className="muted small">Use the paperclip to share files, notes or exercises.</p>}
              {resources.map((r) => (
                <span key={r.id} className="resource-link">
                  <span className="resource-icon" style={{ width: 34, height: 34, borderRadius: 10 }}>
                    <Icon name="file" size={18} />
                  </span>
                  <span className="stack" style={{ gap: 0 }}>
                    <span>{r.fileName}</span>
                    <span className="muted tiny">
                      {r.from === 'me' ? 'You' : user.name.split(' ')[0]} · {r.size}
                    </span>
                  </span>
                </span>
              ))}
            </section>

            <section className="card-dark stack" style={{ gap: 10, padding: 20 }}>
              <span className="label-caps" style={{ fontSize: 12, color: '#A99BFF' }}>
                Exchange progress
              </span>
              {connection ? (
                <>
                  <strong style={{ fontSize: 18 }}>
                    {Math.min(done, connection.total)} of {connection.total} sessions
                  </strong>
                  <ProgressBar value={(done / connection.total) * 100} variant="dark" label="Exchange progress" />
                </>
              ) : (
                <span className="small" style={{ color: 'var(--night-text)' }}>
                  Not connected yet. Send a swap request from their profile.
                </span>
              )}
              <div className="row" style={{ gap: 12, paddingTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ color: '#C9BEFF', padding: '8px 0' }} onClick={() => setDialog('report')}>
                  Report
                </button>
                <button type="button" className="btn btn-ghost" style={{ color: '#C9BEFF', padding: '8px 0' }} onClick={() => setDialog('block')}>
                  Block
                </button>
              </div>
            </section>
          </aside>
        </>
      ) : (
        <div className="empty" style={{ flex: '999 1 480px' }}>
          <strong style={{ fontSize: 20 }}>No conversations yet</strong>
          <p className="muted">Connect with a skill partner to start chatting.</p>
          <Link className="btn btn-primary" to="/match">
            Find partners
          </Link>
        </div>
      )}

      {dialog && user && <ReportDialog user={user} mode={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}
