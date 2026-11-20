import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import MatchBadge from '../components/MatchBadge.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useMatches } from '../hooks/useMatches.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { getUser } from '../data/users.js';
import { formatLong, monthDay, relativeTime, todayISO } from '../utils/dates.js';
import { learningProgress, learningStats, sessionsWithPartner, upcomingSessions, weeklyHours } from '../utils/progress.js';
import './Dashboard.css';

const NOTE_STYLE = {
  match: { icon: 'swap', style: { background: 'var(--gradient-diag)', color: '#fff' } },
  request: { icon: 'userPlus', style: { background: 'var(--purple-tint)', color: 'var(--purple-ink)' } },
  reminder: { icon: 'clock', style: { background: 'var(--blue-tint)', color: 'var(--blue-ink)' } },
  info: { icon: 'bell', style: { background: '#F2F0FB', color: 'var(--ink-2)' } },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();
  const { state, acceptRequest, declineRequest, cancelRequest, markNotificationRead, unblockUser } = useApp();
  const ranked = useMatches();
  const { profile } = state;

  const suggested = useMemo(
    () => ranked.filter(({ user }) => !state.connections.some((c) => c.userId === user.id)).slice(0, 3),
    [ranked, state.connections],
  );
  const upcoming = upcomingSessions(state);
  const progress = learningProgress(state);
  const stats = learningStats(state);
  const weeks = weeklyHours(state);
  const maxWeek = Math.max(1, ...weeks);

  const openNote = (n) => {
    markNotificationRead(n.id);
    if (n.link) navigate(n.link);
  };

  const weekLabels = weeks.map((_, i) => (i === weeks.length - 1 ? 'This wk' : `${weeks.length - 1 - i}w ago`));

  return (
    <div className="container page">
      <div className="row-between" style={{ alignItems: 'flex-end' }}>
        <div className="stack" style={{ gap: 6 }}>
          <span className="muted" style={{ fontSize: 15 }}>
            {formatLong(todayISO())}
          </span>
          <h1 className="page-title">
            {greeting()}, {profile.name.split(' ')[0]}
          </h1>
        </div>
        <Link className="btn btn-primary" to="/match">
          <Icon name="search" size={18} strokeWidth={2.2} /> Find new partners
        </Link>
      </div>

      {/* Notifications */}
      <section aria-label="Latest notifications" className="grid-fit" style={{ '--min': '280px', '--gap': '12px' }}>
        {state.notifications.slice(0, 3).map((n) => {
          const look = NOTE_STYLE[n.type] || NOTE_STYLE.info;
          return (
            <button key={n.id} type="button" className={`note-card${n.read ? '' : ' unread'}`} onClick={() => openNote(n)}>
              <span className="note-icon" style={look.style}>
                <Icon name={look.icon} size={20} />
              </span>
              <span>
                {n.text} <span className="muted">· {relativeTime(n.createdAt)}</span>
              </span>
            </button>
          );
        })}
      </section>

      <div className="split">
        <div className="main">
          {/* Skills */}
          <div className="grid-fit" style={{ '--min': '260px' }}>
            <section className="skills-box teach">
              <div className="row-between">
                <h2 className="row" style={{ fontSize: 17, color: 'var(--purple-deep)', gap: 8 }}>
                  <span className="legend-icon teach" style={{ width: 28, height: 28, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--purple)', color: '#fff' }}>
                    <Icon name="teach" size={16} strokeWidth={2.4} />
                  </span>
                  My Skills
                </h2>
                <Link to="/signup" className="small" style={{ fontWeight: 700 }}>
                  Edit
                </Link>
              </div>
              {profile.teach.map((s) => (
                <div key={s.name} className="skill-line" style={{ background: 'var(--purple-tint-2)' }}>
                  <strong style={{ color: 'var(--purple-deep)' }}>{s.name}</strong>
                  <span className="tiny" style={{ fontWeight: 700, color: 'var(--purple-ink)' }}>
                    {s.level}
                  </span>
                </div>
              ))}
              <span className="muted tiny">
                {stats.sessions} session{stats.sessions === 1 ? '' : 's'} completed on SkillSwap
              </span>
            </section>
            <section className="skills-box learn">
              <div className="row-between">
                <h2 className="row" style={{ fontSize: 17, color: 'var(--blue-deep)', gap: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 9, border: '2px solid var(--blue-ink)', color: 'var(--blue-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="learn" size={16} strokeWidth={2.4} />
                  </span>
                  Skills I Want to Learn
                </h2>
                <Link to="/signup" className="small" style={{ fontWeight: 700 }}>
                  Edit
                </Link>
              </div>
              {profile.learn.map((s, i) => (
                <div key={s.name} className="stack" style={{ background: 'var(--blue-tint-2)', borderRadius: 14, padding: 14, gap: 10 }}>
                  <div className="row-between">
                    <strong style={{ color: 'var(--blue-deep)' }}>{s.name}</strong>
                    <span className="tiny" style={{ fontWeight: 700, color: 'var(--blue-ink)' }}>
                      {s.level} → {s.level === 'Advanced' ? 'Fluent' : s.level === 'Intermediate' ? 'Advanced' : 'Intermediate'}
                    </span>
                  </div>
                  <ProgressBar value={i === 0 ? progress.percent : Math.round(progress.percent / 3)} variant="blue" label={`${s.name} progress`} />
                  <span className="tiny" style={{ color: 'var(--ink-2)' }}>
                    {i === 0 ? `${progress.percent}% to your goal · ${progress.done} of ${progress.goal} sessions` : 'Just getting started'}
                  </span>
                </div>
              ))}
              <Link to="/signup" className="small" style={{ fontWeight: 700 }}>
                + Add another skill to learn
              </Link>
            </section>
          </div>

          {/* Suggested partners */}
          <section className="card stack">
            <div className="row-between">
              <h2 className="card-title">Suggested skill partners</h2>
              <Link to="/match" className="small" style={{ fontWeight: 700 }}>
                See all
              </Link>
            </div>
            <div className="grid-fit" style={{ '--min': '220px', '--gap': '14px' }}>
              {suggested.map(({ user, match }) => (
                <Link key={user.id} className={`mini-partner lift${match.perfect ? ' perfect' : ''}`} to={`/profile/${user.id}`}>
                  <span style={{ alignSelf: 'flex-start' }}>
                    <MatchBadge type={match.type} />
                  </span>
                  <span className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                    <Avatar name={user.name} palette={user.palette} size={44} />
                    <span className="stack" style={{ gap: 0 }}>
                      <strong>{user.name}</strong>
                      <span className="muted tiny">
                        {user.location.split(',')[0]} · {user.method}
                      </span>
                    </span>
                  </span>
                  <span className="tiny">
                    <span style={{ color: 'var(--purple-ink)', fontWeight: 700 }}>Teaches</span> {user.teaches[0].name} ·{' '}
                    <span style={{ color: 'var(--blue-ink)', fontWeight: 700 }}>Wants</span> {user.wants[0].name}
                  </span>
                </Link>
              ))}
              {suggested.length === 0 && <p className="muted">You're connected with all your best matches. Nice!</p>}
            </div>
          </section>

          {/* Active exchanges */}
          <section className="card stack">
            <h2 className="card-title">Active learning exchanges</h2>
            {state.connections.length === 0 && <p className="muted">No active exchanges yet. Accept a request or connect with a match to start.</p>}
            {state.connections
              .filter((c) => !state.blocked.includes(c.userId))
              .map((c) => {
                const user = getUser(c.userId);
                const done = sessionsWithPartner(state, c.userId);
                return (
                  <div key={c.userId} className="exchange-row">
                    <Avatar name={user.name} palette={user.palette} size={48} />
                    <div className="stack" style={{ flex: '1 1 220px', gap: 4 }}>
                      <Link to={`/profile/${user.id}`} style={{ color: 'var(--ink)', fontWeight: 800, textDecoration: 'none' }}>
                        {user.name}
                      </Link>
                      <span className="muted small">
                        {c.kind === 'buddy' ? (
                          <>Study buddies · {c.goal}</>
                        ) : (
                          <>
                            <span style={{ color: 'var(--purple-ink)', fontWeight: 700 }}>You teach</span> {user.wants[0].name} ⇄{' '}
                            <span style={{ color: 'var(--blue-ink)', fontWeight: 700 }}>you learn</span> {user.teaches[0].name}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="stack" style={{ flex: '1 1 200px', gap: 6 }}>
                      <div className="row-between tiny">
                        <span className="muted">Sessions</span>
                        <strong>
                          {Math.min(done, c.total)} of {c.total}
                        </strong>
                      </div>
                      <ProgressBar value={(done / c.total) * 100} label={`Exchange with ${user.name}`} />
                    </div>
                    <div className="row" style={{ gap: 4 }}>
                      <Link className="btn btn-ghost" to={`/messages/${user.id}`} style={{ color: 'var(--purple-ink)' }}>
                        Open chat
                      </Link>
                      <Link className="btn btn-tint" to={`/sessions?with=${user.id}`}>
                        Book
                      </Link>
                    </div>
                  </div>
                );
              })}
          </section>

          {/* Progress */}
          <section className="card stack" style={{ gap: 20 }}>
            <div className="row-between">
              <h2 className="card-title">Learning progress</h2>
              <span className="muted small">Hours per week · last 8 weeks</span>
            </div>
            <div className="grid-fit" style={{ '--min': '150px', '--gap': '12px' }}>
              <div className="stat">
                <span className="muted tiny">Sessions completed</span>
                <strong>{stats.sessions}</strong>
              </div>
              <div className="stat">
                <span className="muted tiny">Hours exchanged</span>
                <strong>{stats.hours}</strong>
              </div>
              <div className="stat">
                <span className="muted tiny">Weekly streak</span>
                <strong>{stats.streak} weeks</strong>
              </div>
              <div className="stat">
                <span className="muted tiny">Reviews given</span>
                <strong>{stats.reviews}</strong>
              </div>
            </div>
            <div className="bar-chart" role="img" aria-label={`Hours per week: ${weeks.join(', ')}`}>
              {weeks.map((h, i) => (
                <div key={weekLabels[i]} className="bar-col" title={`${h} h`}>
                  <div className={`bar${i === weeks.length - 1 ? ' current' : ''}`} style={{ height: `${(h / maxWeek) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="bar-labels" style={{ marginTop: -12 }}>
              {weekLabels.map((l, i) => (
                <span key={l} style={i === weeks.length - 1 ? { fontWeight: 700, color: 'var(--ink)' } : undefined}>
                  {l}
                </span>
              ))}
            </div>
          </section>
        </div>

        <aside className="side">
          {/* Pending requests */}
          <section className="card stack" style={{ gap: 14, padding: 22 }}>
            <div className="row-between">
              <h2 style={{ fontSize: 18 }}>Pending requests</h2>
              <span className="tag" style={{ background: 'var(--pink-tint)', color: '#A3164A', padding: '4px 10px' }}>
                {state.incomingRequests.length + state.sentRequests.length}
              </span>
            </div>
            {state.incomingRequests.length + state.sentRequests.length === 0 && <p className="muted small">No pending requests.</p>}
            {state.incomingRequests.map((r) => {
              const user = getUser(r.userId);
              return (
                <div key={r.userId} className="request-card">
                  <Link to={`/profile/${user.id}`} className="row" style={{ gap: 10, color: 'var(--ink)', textDecoration: 'none', flexWrap: 'nowrap' }}>
                    <Avatar name={user.name} palette={user.palette} size={42} />
                    <span className="stack" style={{ gap: 0 }}>
                      <strong style={{ fontSize: 15 }}>{user.name}</strong>
                      <span className="muted tiny">
                        {user.teaches[0].name} ⇄ {user.wants[0].name}
                      </span>
                    </span>
                  </Link>
                  <p className="small" style={{ color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    “{r.message}”
                  </p>
                  <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <button type="button" className="btn btn-soft" style={{ flex: '1 1 0' }} onClick={() => declineRequest(user.id)}>
                      Decline
                    </button>
                    <button type="button" className="btn btn-primary" style={{ flex: '1 1 0' }} onClick={() => acceptRequest(user.id)}>
                      Accept
                    </button>
                  </div>
                </div>
              );
            })}
            {state.sentRequests.map((id) => {
              const user = getUser(id);
              return (
                <div key={id} className="request-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar name={user.name} palette={user.palette} size={42} />
                  <span className="stack" style={{ flex: '1 1 auto', gap: 0 }}>
                    <strong style={{ fontSize: 15 }}>{user.name}</strong>
                    <span className="muted tiny">You sent · awaiting reply</span>
                  </span>
                  <button type="button" className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 10px' }} onClick={() => cancelRequest(id)}>
                    Withdraw
                  </button>
                </div>
              );
            })}
          </section>

          {/* Upcoming sessions */}
          <section className="card-dark stack" style={{ gap: 14, padding: 22 }}>
            <div className="row-between">
              <h2 style={{ fontSize: 18 }}>Upcoming sessions</h2>
              <Link to="/sessions" style={{ color: '#C9BEFF', fontWeight: 700 }} className="small">
                All
              </Link>
            </div>
            {upcoming.length === 0 && <p className="muted small">Nothing booked yet.</p>}
            {upcoming.slice(0, 3).map((s) => {
              const user = getUser(s.partnerId);
              const d = monthDay(s.date);
              return (
                <Link key={s.id} to="/sessions" className="session-row">
                  <span className="date-chip">
                    <span className="dow" style={{ display: 'block' }}>
                      {d.dow}
                    </span>
                    <span className="day" style={{ display: 'block' }}>
                      {d.day}
                    </span>
                  </span>
                  <span className="stack small" style={{ gap: 2 }}>
                    <strong>
                      {s.focus === 'Both, 50/50' ? 'Swap' : s.focus.replace(' first', '')} with {user.name.split(' ')[0]}
                    </strong>
                    <span style={{ color: 'var(--night-text)' }}>
                      {s.time} · {s.duration} min · {s.mode === 'Online' ? 'Video' : 'In person'}
                    </span>
                  </span>
                </Link>
              );
            })}
            <Link className="btn btn-white" to="/sessions">
              Schedule a session
            </Link>
          </section>

          {/* Favorites */}
          <section id="favorites" className="card stack" style={{ gap: 12, padding: 22 }}>
            <h2 style={{ fontSize: 18 }}>Favorites</h2>
            {state.favorites.length === 0 && <p className="muted small">Tap the heart on a profile to save it here.</p>}
            <div className="row" style={{ gap: 8 }}>
              {state.favorites.map((id) => {
                const user = getUser(id);
                return (
                  <Link key={id} to={`/profile/${id}`} aria-label={user.name} title={user.name} style={{ borderRadius: '50%' }}>
                    <Avatar name={user.name} palette={user.palette} size={44} />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Blocked */}
          <section id="blocked" className="card stack" style={{ gap: 12, padding: 22 }}>
            <h2 style={{ fontSize: 18 }}>Blocked members</h2>
            {state.blocked.length === 0 && <p className="muted small">You haven&apos;t blocked anyone.</p>}
            {state.blocked.map((id) => {
              const user = getUser(id);
              return (
                <div key={id} className="row-between">
                  <span className="row" style={{ gap: 10 }}>
                    <Avatar name={user.name} palette={user.palette} size={36} />
                    <strong className="small">{user.name}</strong>
                  </span>
                  <button type="button" className="btn btn-soft" style={{ fontSize: 13 }} onClick={() => unblockUser(id)}>
                    Unblock
                  </button>
                </div>
              );
            })}
          </section>
        </aside>
      </div>
    </div>
  );
}
