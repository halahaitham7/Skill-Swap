import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon, { StarIcon } from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import MatchBadge from '../components/MatchBadge.jsx';
import SkillChip from '../components/SkillChip.jsx';
import StarRating from '../components/StarRating.jsx';
import ReportDialog from '../components/ReportDialog.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { getUser } from '../data/users.js';
import { DAYS } from '../data/skills.js';
import { availabilityGrid, computeMatch } from '../utils/matching.js';
import { addDays, formatLong, mondayFirstDow, toISODate } from '../utils/dates.js';
import NotFound from './NotFound.jsx';
import './Profile.css';

const SLOT_TIME = { Morning: '10:00', Afternoon: '15:00', Evening: '19:00' };

/** Finds the next date in the coming two weeks when both people are free. */
function nextSharedSlot(overlap) {
  for (let i = 1; i <= 14; i += 1) {
    const date = addDays(new Date(), i);
    const dow = mondayFirstDow(date);
    const slot = ['Evening', 'Afternoon', 'Morning'].find((s) => overlap.includes(`${dow}-${s}`));
    if (slot) return { date: toISODate(date), time: SLOT_TIME[slot] };
  }
  return null;
}

export default function Profile() {
  const { userId } = useParams();
  const user = getUser(userId);
  useDocumentTitle(user ? user.name : 'Profile not found');
  const navigate = useNavigate();
  const { state, toggleFavorite, sendRequest, cancelRequest, startConversation, unblockUser } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const match = useMemo(() => (user ? computeMatch(state.profile, user) : null), [state.profile, user]);
  const grid = useMemo(() => (user ? availabilityGrid(state.profile, user) : []), [state.profile, user]);

  if (!user) return <NotFound />;

  const firstName = user.name.split(' ')[0];
  const fav = state.favorites.includes(user.id);
  const sent = state.sentRequests.includes(user.id);
  const connected = state.connections.some((c) => c.userId === user.id);
  const blocked = state.blocked.includes(user.id);
  const suggestion = nextSharedSlot(match.overlap);

  const myReviews = state.sessions
    .filter((s) => s.partnerId === user.id && s.review && s.review.text)
    .map((s) => ({ author: `${state.profile.name} (you)`, palette: state.profile.palette, swap: s.focus, date: formatLong(s.date), rating: s.review.rating, text: s.review.text }));
  const reviews = [...myReviews, ...user.reviews];
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 2);

  const message = () => {
    startConversation(user.id);
    navigate(`/messages/${user.id}`);
  };

  if (blocked) {
    return (
      <div className="container page">
        <div className="empty">
          <Icon name="block" size={32} />
          <strong style={{ fontSize: 20 }}>You blocked {user.name}</strong>
          <p className="muted">They can&apos;t message you or see your profile, and they won&apos;t appear in your matches.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link className="btn btn-soft" to="/match">
              Back to matches
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => unblockUser(user.id)}>
              Unblock {firstName}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myTeach = state.profile.teach.map((s) => s.name.toLowerCase());
  const myLearn = state.profile.learn.map((s) => s.name.toLowerCase());

  return (
    <div className="container page" style={{ paddingTop: 24 }}>
      <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => navigate(-1)}>
        <Icon name="arrowLeft" size={18} /> Back
      </button>

      {/* Header */}
      <section className="profile-header">
        <div className="profile-banner" />
        <div className="profile-head-body">
          <Avatar name={user.name} palette={user.palette} size={120} ring />
          <div className="stack" style={{ flex: '1 1 320px', gap: 8 }}>
            <div className="row" style={{ gap: 10 }}>
              <h1 style={{ fontSize: 34, letterSpacing: '-0.03em' }}>{user.name}</h1>
              <MatchBadge type={match.type} score={match.perfect ? match.score : undefined} />
            </div>
            <div className="profile-meta">
              <span>
                <Icon name="pin" size={16} /> {user.location}
              </span>
              <span>
                <Icon name="monitor" size={16} /> {user.method === 'Both' ? 'Online or in person' : user.method === 'Online' ? 'Online sessions' : 'In-person sessions'}
              </span>
              <span style={{ color: 'var(--ink)', fontWeight: 700 }}>
                <StarIcon size={16} /> {user.rating.toFixed(1)} <span className="muted" style={{ fontWeight: 500 }}>· {user.reviewCount} reviews</span>
              </span>
              <span>Member since {user.memberSince}</span>
            </div>
          </div>
          <div className="row dropdown" style={{ gap: 10 }}>
            <button
              type="button"
              className="icon-btn bordered fav-btn"
              style={{ width: 48, height: 48, borderRadius: 14 }}
              aria-pressed={fav}
              aria-label={fav ? `Remove ${firstName} from favorites` : `Save ${firstName} to favorites`}
              onClick={() => toggleFavorite(user.id)}
            >
              <Icon name="heart" size={22} fill={fav ? 'currentColor' : 'none'} />
            </button>
            <button type="button" className="btn btn-soft" onClick={message}>
              <Icon name="message" size={18} /> Message
            </button>
            {connected ? (
              <Link className="btn btn-primary" to={`/sessions?with=${user.id}`}>
                <Icon name="calendar" size={18} /> Schedule
              </Link>
            ) : (
              <button type="button" className={`btn ${sent ? 'btn-success' : 'btn-primary'}`} onClick={() => (sent ? cancelRequest(user.id) : sendRequest(user.id))}>
                {sent ? 'Request sent ✓' : 'Send swap request'}
              </button>
            )}
            <button
              type="button"
              className="icon-btn bordered"
              style={{ width: 48, height: 48, borderRadius: 14 }}
              aria-label="More options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <Icon name="menu" size={20} />
            </button>
            {menuOpen && (
              <div className="dropdown-panel" role="menu" style={{ width: 240 }}>
                <button type="button" role="menuitem" className="dropdown-item" onClick={() => { setMenuOpen(false); setDialog('report'); }}>
                  <Icon name="flag" size={18} /> Report profile
                </button>
                <button type="button" role="menuitem" className="dropdown-item" style={{ color: '#B3123F' }} onClick={() => { setMenuOpen(false); setDialog('block'); }}>
                  <Icon name="block" size={18} /> Block {firstName}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="split">
        <div className="main">
          {/* Why you match */}
          <section className="card stack" style={{ gap: 20, padding: 28 }}>
            <h2 className="card-title" style={{ fontSize: 22 }}>
              {match.perfect ? 'Why you two match' : 'How your skills compare'}
            </h2>
            <div className="grid-fit" style={{ '--min': '240px' }}>
              <div className="compare-box" style={{ background: 'var(--purple-tint-2)' }}>
                <div className="row" style={{ gap: 10 }}>
                  <Avatar name={state.profile.name} palette={state.profile.palette} src={state.profile.avatar} size={40} />
                  <strong>You · {state.profile.name.split(' ')[0]}</strong>
                </div>
                <div className="stack" style={{ gap: 6 }}>
                  <span className="label-caps teach">Can teach</span>
                  <div className="row" style={{ gap: 6 }}>
                    {state.profile.teach.map((s) => (
                      <SkillChip key={s.name} name={s.name} level={s.level} kind="teach" hit={match.theyWantFromMe.includes(s.name) || user.wants.some((w) => w.name.toLowerCase() === s.name.toLowerCase())} />
                    ))}
                  </div>
                </div>
                <div className="stack" style={{ gap: 6 }}>
                  <span className="label-caps learn">Wants to learn</span>
                  <div className="row" style={{ gap: 6 }}>
                    {state.profile.learn.map((s) => (
                      <SkillChip key={s.name} name={s.name} level={s.level} kind="learn" hit={user.teaches.some((t) => t.name.toLowerCase() === s.name.toLowerCase())} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="compare-box" style={{ background: 'var(--blue-tint-2)' }}>
                <div className="row" style={{ gap: 10 }}>
                  <Avatar name={user.name} palette={user.palette} size={40} />
                  <strong>{firstName}</strong>
                </div>
                <div className="stack" style={{ gap: 6 }}>
                  <span className="label-caps teach">Can teach</span>
                  <div className="row" style={{ gap: 6 }}>
                    {user.teaches.map((s) => (
                      <SkillChip key={s.name} name={s.name} level={s.note || s.level} kind="teach" hit={myLearn.includes(s.name.toLowerCase())} />
                    ))}
                  </div>
                </div>
                <div className="stack" style={{ gap: 6 }}>
                  <span className="label-caps learn">Wants to learn</span>
                  <div className="row" style={{ gap: 6 }}>
                    {user.wants.map((s) => (
                      <SkillChip key={s.name} name={s.name} level={s.level} kind="learn" hit={myTeach.includes(s.name.toLowerCase())} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 10 }}>
              {[
                [match.theyWantFromMe.length > 0, `You teach what ${firstName} wants`, `${firstName} doesn't want your skills yet`],
                [match.theyTeachForMe.length > 0, `${firstName} teaches what you want`, `${firstName} doesn't teach what you want`],
                [match.methodOk, 'Learning methods are compatible', 'Different learning methods'],
                [match.overlap.length > 0, `${match.overlap.length} shared free time slot${match.overlap.length === 1 ? '' : 's'}`, 'No shared free time yet'],
              ].map(([ok, yes, no]) => (
                <span key={yes} className={`fit-pill ${ok ? 'yes' : 'no'}`}>
                  <Icon name={ok ? 'check' : 'close'} size={16} strokeWidth={2.6} />
                  {ok ? yes : no}
                </span>
              ))}
            </div>
          </section>

          {/* About */}
          <section className="card stack" style={{ gap: 14, padding: 28 }}>
            <h2 className="card-title" style={{ fontSize: 22 }}>
              About {firstName}
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)' }}>{user.bio}</p>
            <div className="grid-fit" style={{ '--min': '200px', '--gap': '12px' }}>
              <div className="fact">
                <span className="muted tiny">Teaching style</span>
                <strong style={{ fontSize: 15 }}>{user.teachingStyle}</strong>
              </div>
              <div className="fact">
                <span className="muted tiny">Session length</span>
                <strong style={{ fontSize: 15 }}>{user.sessionLength}</strong>
              </div>
              <div className="fact">
                <span className="muted tiny">Languages spoken</span>
                <strong style={{ fontSize: 15 }}>{user.languages}</strong>
              </div>
            </div>
          </section>

          {/* Availability */}
          <section className="card stack" style={{ gap: 18, padding: 28 }}>
            <div className="row-between">
              <h2 className="card-title" style={{ fontSize: 22 }}>
                When you&apos;re both free
              </h2>
              <div className="row muted tiny" style={{ gap: 14 }}>
                <span className="row" style={{ gap: 6 }}>
                  <span className="legend-swatch-lg" style={{ width: 16, height: 16, borderRadius: 5, background: 'var(--purple)', display: 'inline-block' }} />
                  Both free
                </span>
                <span className="row" style={{ gap: 6 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 5, background: '#D6E6FB', display: 'inline-block' }} />
                  {firstName} only
                </span>
                <span className="row" style={{ gap: 6 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 5, background: '#fff', border: '1.5px dashed #9C8CF5', display: 'inline-block' }} />
                  You only
                </span>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="avail-table">
                <caption className="sr-only">Weekly availability for you and {firstName}</caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">Time</span>
                    </th>
                    {DAYS.map((d) => (
                      <th key={d} scope="col">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.map((row) => (
                    <tr key={row.time}>
                      <th scope="row">{row.time}</th>
                      {row.cells.map((cell) => (
                        <td key={cell.day} className={cell.state}>
                          {cell.state === 'both' ? 'Both' : cell.state === 'them' ? firstName : cell.state === 'you' ? 'You' : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link to="/signup" className="small" style={{ fontWeight: 700 }}>
              Update your availability
            </Link>
          </section>

          {/* Reviews */}
          <section className="card stack" style={{ gap: 20, padding: 28 }}>
            <div className="row-between">
              <h2 className="card-title" style={{ fontSize: 22 }}>
                Reviews <span className="muted" style={{ fontWeight: 600 }}>({user.reviewCount + myReviews.length})</span>
              </h2>
              <span className="row" style={{ gap: 6, fontWeight: 800, fontSize: 18 }}>
                <StarIcon size={20} /> {user.rating.toFixed(1)} average
              </span>
            </div>
            {reviews.length === 0 && <p className="muted">No written reviews yet. Be the first after your session!</p>}
            {visibleReviews.map((r, i) => (
              <article key={`${r.author}-${i}`} className="review">
                <Avatar name={r.author} palette={r.palette} size={44} />
                <div className="stack" style={{ gap: 6 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <strong>{r.author}</strong>
                    <StarRating value={r.rating} size={15} />
                    <span className="muted tiny">
                      {r.swap} · {r.date}
                    </span>
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)' }}>{r.text}</p>
                </div>
              </article>
            ))}
            {reviews.length > 2 && (
              <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start', paddingLeft: 0, color: 'var(--purple-ink)' }} onClick={() => setShowAllReviews((v) => !v)}>
                {showAllReviews ? 'Show fewer reviews' : `Show all ${reviews.length} reviews`}
              </button>
            )}
          </section>
        </div>

        <aside className="side">
          <section className="card-dark stack" style={{ gap: 16 }}>
            <h2 style={{ fontSize: 18 }}>Suggested first swap</h2>
            {suggestion ? (
              <>
                <div className="stack small" style={{ gap: 10, fontSize: 15 }}>
                  <span className="row" style={{ gap: 10, color: '#fff' }}>
                    <span style={{ color: '#A99BFF' }}>
                      <Icon name="calendar" size={18} />
                    </span>
                    {formatLong(suggestion.date)} · {suggestion.time}
                  </span>
                  <span className="row" style={{ gap: 10 }}>
                    <span style={{ color: '#A99BFF' }}>
                      <Icon name="clock" size={18} />
                    </span>
                    60 min · 30 + 30 split
                  </span>
                  <span className="row" style={{ gap: 10 }}>
                    <span style={{ color: '#A99BFF' }}>
                      <Icon name="video" size={18} />
                    </span>
                    {user.method === 'In person' ? 'In person' : 'Video call'}
                  </span>
                </div>
                <Link className="btn btn-white" to={`/sessions?with=${user.id}&date=${suggestion.date}&time=${suggestion.time}`}>
                  Schedule this session
                </Link>
              </>
            ) : (
              <>
                <p className="muted small">You don&apos;t share free time in the next two weeks. Propose a time in a message instead.</p>
                <button type="button" className="btn btn-white" onClick={message}>
                  Message {firstName}
                </button>
              </>
            )}
          </section>

          <section className="card stack" style={{ gap: 14 }}>
            <h2 style={{ fontSize: 18 }}>Trust &amp; safety</h2>
            <ul className="trust-list">
              <li>
                <span style={{ color: 'var(--green)' }}>{user.verified ? '✓' : '•'}</span>
                {user.verified ? 'Email and phone verified' : 'Email verified · phone not yet verified'}
              </li>
              <li>
                <span style={{ color: 'var(--green)' }}>✓</span>
                {user.exchanges} completed exchanges
              </li>
              <li>
                <span style={{ color: 'var(--green)' }}>✓</span>
                {user.responseTime}
              </li>
            </ul>
            <p className="muted tiny" style={{ lineHeight: 1.55 }}>
              Meet on video first. Something feel off? You can report or block {firstName} at any time.
            </p>
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="btn btn-soft" style={{ flex: '1 1 0' }} onClick={() => setDialog('report')}>
                <Icon name="flag" size={16} /> Report
              </button>
              <button type="button" className="btn btn-soft" style={{ flex: '1 1 0', color: '#B3123F' }} onClick={() => setDialog('block')}>
                <Icon name="block" size={16} /> Block
              </button>
            </div>
          </section>
        </aside>
      </div>

      {dialog && <ReportDialog user={user} mode={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}
