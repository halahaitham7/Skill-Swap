import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import ToggleGroup from '../components/ToggleGroup.jsx';
import StarRating from '../components/StarRating.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { getUser } from '../data/users.js';
import { DURATIONS, START_TIMES } from '../data/skills.js';
import { profileSlots, userSlots } from '../utils/matching.js';
import { addDays, dayOfWeek, formatLong, formatShort, fromISODate, toISODate } from '../utils/dates.js';
import { completedSessions, upcomingSessions } from '../utils/progress.js';
import './Sessions.css';

const FOCUSES = ['Both, 50/50', 'Their skill first', 'My skill first'];
const REVIEW_TAGS = ['Patient', 'Well prepared', 'Clear explanations', 'On time', 'Fun to learn with'];

function ReviewPanel({ pending, selectedId, onSelect }) {
  const { reviewSession } = useApp();
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState(['Patient', 'Well prepared']);
  const [text, setText] = useState('');

  const session = pending.find((s) => s.id === selectedId) || pending[0];

  // Reset the form whenever a different session is being reviewed.
  useEffect(() => {
    setRating(5);
    setTags(['Patient', 'Well prepared']);
    setText('');
  }, [session?.id]);

  if (!session) {
    return (
      <section className="card stack" style={{ gap: 12, border: '2px solid var(--purple-border)' }}>
        <span className="label-caps teach" style={{ fontSize: 12 }}>
          Reviews
        </span>
        <h2 style={{ fontSize: 20 }}>You&apos;re all caught up</h2>
        <p className="muted small">When a session is completed you can rate your partner here.</p>
      </section>
    );
  }

  const partner = getUser(session.partnerId);

  const submit = (e) => {
    e.preventDefault();
    reviewSession(session.id, { rating, tags, text: text.trim() });
  };

  return (
    <section className="card stack" style={{ gap: 16, border: '2px solid var(--purple-border)' }} aria-label="Rate and review">
      <span className="label-caps teach" style={{ fontSize: 12 }}>
        Session complete · {formatShort(session.date)}
      </span>
      <h2 style={{ fontSize: 20 }}>How was your session with {partner.name.split(' ')[0]}?</h2>
      {pending.length > 1 && (
        <label className="field">
          Session to review
          <select className="input" value={session.id} onChange={(e) => onSelect(e.target.value)}>
            {pending.map((s) => (
              <option key={s.id} value={s.id}>
                {getUser(s.partnerId).name} · {formatShort(s.date)}
              </option>
            ))}
          </select>
        </label>
      )}
      <form className="stack" onSubmit={submit}>
        <StarRating value={rating} onChange={setRating} />
        <ToggleGroup label="What stood out?" options={REVIEW_TAGS} value={tags} onChange={setTags} variant="round purple" />
        <label className="field">
          Write a review
          <textarea className="input" rows={3} placeholder="What did you learn? What could be better?" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary">
          Post review
        </button>
      </form>
    </section>
  );
}

export default function Sessions() {
  useDocumentTitle('Sessions');
  const { state, scheduleSession, completeSession, cancelSession, notify } = useApp();
  const [params] = useSearchParams();

  const partners = useMemo(() => {
    const ids = state.connections.map((c) => c.userId).filter((id) => !state.blocked.includes(id));
    const requested = params.get('with');
    if (requested && getUser(requested) && !ids.includes(requested) && !state.blocked.includes(requested)) ids.push(requested);
    return ids.map(getUser);
  }, [state.connections, state.blocked, params]);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => toISODate(addDays(new Date(), i + 1))), []);

  const initialPartner = partners.find((p) => p.id === params.get('with'))?.id || partners[0]?.id || '';
  const initialDate = days.includes(params.get('date')) ? params.get('date') : days[5];
  const initialTime = START_TIMES.includes(params.get('time')) ? params.get('time') : '18:00';

  const [partnerId, setPartnerId] = useState(initialPartner);
  const [focus, setFocus] = useState(FOCUSES[0]);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [duration, setDuration] = useState(60);
  const [mode, setMode] = useState('Online');
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(null);
  const [reviewId, setReviewId] = useState(null);

  // Follow ?with= changes (e.g. clicking "Schedule" from another page).
  useEffect(() => {
    const requested = params.get('with');
    if (requested && partners.some((p) => p.id === requested)) setPartnerId(requested);
  }, [params, partners]);

  // Clear validation messages as soon as the booking details change.
  useEffect(() => {
    setError('');
  }, [partnerId, date, time, mode, place]);

  const partner = getUser(partnerId);
  const mySlots = profileSlots(state.profile);
  const theirSlots = partner ? userSlots(partner) : [];
  const freeDays = new Set(
    days.filter((d) => {
      const dow = dayOfWeek(d);
      return mySlots.some((s) => s.startsWith(`${dow}-`) && theirSlots.includes(s));
    }),
  );

  const firstName = partner ? partner.name.split(' ')[0] : 'partner';
  const focusLabels = partner
    ? [
        { value: 'Both, 50/50', label: 'Both, 50/50' },
        { value: `${partner.teaches[0].name} first`, label: `${partner.teaches[0].name} first` },
        { value: `${partner.wants[0].name} first`, label: `${partner.wants[0].name} first` },
      ]
    : FOCUSES;

  const submit = (e) => {
    e.preventDefault();
    if (!partner) return setError('Choose a partner first.');
    if (mode === 'In person' && !place.trim()) return setError('Add a public meeting place for in-person sessions.');
    const clash = state.sessions.some((s) => s.status === 'upcoming' && s.date === date && s.time === time);
    if (clash) return setError('You already have a session at that time.');
    setError('');
    scheduleSession({ partnerId, focus, date, time, duration, mode, place: place.trim(), note: note.trim() });
    setBooked({ partner: partner.name, date, time });
    setNote('');
    return undefined;
  };

  const upcoming = upcomingSessions(state);
  const completed = completedSessions(state).sort((a, b) => b.date.localeCompare(a.date));
  const pendingReviews = completed.filter((s) => !s.review);

  return (
    <div className="container page">
      <h1 className="page-title">Skill exchange sessions</h1>

      <div className="split">
        {/* Schedule */}
        <section className="main card" style={{ padding: 28, gap: 24 }} aria-labelledby="schedule-title">
          <div className="row-between">
            <h2 id="schedule-title" style={{ fontSize: 22 }}>
              Schedule a session
            </h2>
            {partner && (
              <span className="row" style={{ gap: 10, background: 'var(--bg)', borderRadius: 999, padding: '6px 14px 6px 6px', flexWrap: 'nowrap' }}>
                <Avatar name={partner.name} palette={partner.palette} size={34} />
                <span className="small" style={{ fontWeight: 700 }}>
                  with {partner.name}
                </span>
              </span>
            )}
          </div>

          {partners.length === 0 ? (
            <div className="empty">
              <strong>No partners yet</strong>
              <p className="muted">Connect with someone first, then book your first session.</p>
              <Link className="btn btn-primary" to="/match">
                Find partners
              </Link>
            </div>
          ) : (
            <form className="stack" style={{ gap: 24 }} onSubmit={submit}>
              <label className="field">
                Partner
                <select className="input" value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.teaches[0].name} ⇄ {p.wants[0].name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="stack" style={{ gap: 10 }}>
                <span className="small" style={{ fontWeight: 700 }}>
                  Focus of this session
                </span>
                <ToggleGroup label="Session focus" options={focusLabels} value={focus} onChange={setFocus} variant="purple" />
              </div>

              <div className="stack" style={{ gap: 10 }}>
                <div className="row-between">
                  <span className="small" style={{ fontWeight: 700 }}>
                    Pick a day{' '}
                    <span className="muted" style={{ fontWeight: 500 }}>
                      · {formatShort(days[0])} – {formatShort(days[13])}
                    </span>
                  </span>
                  <span className="row muted tiny" style={{ gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#12A16B', display: 'inline-block' }} />
                    You&apos;re both free
                  </span>
                </div>
                <div className="day-grid" role="group" aria-label="Day">
                  {days.map((d) => {
                    const free = freeDays.has(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        className="day-btn"
                        aria-pressed={date === d}
                        aria-label={`${formatLong(d)}${free ? ', you are both free' : ''}`}
                        onClick={() => setDate(d)}
                      >
                        <span className="dow">{dayOfWeek(d)}</span>
                        <span className="num">{fromISODate(d).getDate()}</span>
                        <span className={`free-dot${free ? ' on' : ''}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid-fit" style={{ '--min': '240px', '--gap': '20px' }}>
                <div className="stack" style={{ gap: 10 }}>
                  <span className="small" style={{ fontWeight: 700 }}>
                    Start time
                  </span>
                  <ToggleGroup label="Start time" options={START_TIMES} value={time} onChange={setTime} variant="purple" />
                </div>
                <div className="stack" style={{ gap: 10 }}>
                  <span className="small" style={{ fontWeight: 700 }}>
                    Duration
                  </span>
                  <ToggleGroup
                    label="Duration"
                    options={DURATIONS.map((d) => ({ value: d, label: `${d} min` }))}
                    value={duration}
                    onChange={setDuration}
                    variant="purple"
                  />
                </div>
              </div>

              <div className="stack" style={{ gap: 10 }}>
                <span className="small" style={{ fontWeight: 700 }}>
                  Meeting type
                </span>
                <div className="grid-2" role="group" aria-label="Meeting type">
                  {[
                    { value: 'Online', sub: 'Video call link added for you', icon: 'video' },
                    { value: 'In person', sub: 'Pick a public place to meet', icon: 'pin' },
                  ].map((m) => (
                    <button key={m.value} type="button" className="mode-card" aria-pressed={mode === m.value} onClick={() => setMode(m.value)}>
                      <span className="row" style={{ gap: 8 }}>
                        <Icon name={m.icon} size={18} />
                        <strong style={{ fontSize: 16 }}>{m.value}</strong>
                      </span>
                      <span className="muted tiny">{m.sub}</span>
                    </button>
                  ))}
                </div>
                {mode === 'In person' && (
                  <label className="field">
                    Meeting place
                    <input className="input" type="text" placeholder="e.g. a café or library near you both" value={place} onChange={(e) => setPlace(e.target.value)} />
                    <span className="hint tiny">Tip: meet somewhere public for your first session.</span>
                  </label>
                )}
              </div>

              <label className="field">
                <span>
                  Note for {firstName} <span className="hint">(optional)</span>
                </span>
                <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What would you like to cover?" />
              </label>

              {error && (
                <p className="notice warning" role="alert">
                  {error}
                </p>
              )}
              {booked && !error && (
                <p className="notice success" role="status">
                  Booked with {booked.partner} on {formatLong(booked.date)} at {booked.time}. We added it to your calendar and told {booked.partner.split(' ')[0]}.{' '}
                  <Link to={`/messages/${partnerId}`}>Open chat</Link>
                </p>
              )}

              <div className="summary-bar">
                <strong style={{ fontSize: 15 }}>
                  {formatShort(date)} · {time} · {duration} min · {mode}
                </strong>
                <button type="submit" className="btn btn-primary">
                  <Icon name="calendar" size={18} /> Book session
                </button>
              </div>
            </form>
          )}
        </section>

        <div className="side">
          <ReviewPanel pending={pendingReviews} selectedId={reviewId} onSelect={setReviewId} />

          <section className="card stack" style={{ gap: 14 }}>
            <div className="row-between">
              <h2 style={{ fontSize: 18 }}>Upcoming</h2>
              <span className="muted small">{upcoming.length} booked</span>
            </div>
            {upcoming.length === 0 && <p className="muted small">No sessions booked.</p>}
            <ol className="history">
              {upcoming.map((s) => {
                const p = getUser(s.partnerId);
                return (
                  <li key={s.id}>
                    <span className="status-icon" style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}>
                      <Icon name="calendar" size={18} />
                    </span>
                    <span className="stack small" style={{ flex: '1 1 160px', gap: 0 }}>
                      <strong>
                        {p.name.split(' ')[0]} · {s.focus}
                      </strong>
                      <span className="muted">
                        {formatShort(s.date)} · {s.time} · {s.duration} min · {s.mode}
                        {s.place ? ` · ${s.place}` : ''}
                      </span>
                    </span>
                    <span className="row" style={{ gap: 6 }}>
                      <button type="button" className="btn btn-tint small-btn" onClick={() => completeSession(s.id)}>
                        Mark done
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost small-btn"
                        onClick={() => {
                          if (window.confirm(`Cancel your session with ${p.name} on ${formatShort(s.date)}?`)) cancelSession(s.id);
                        }}
                      >
                        Cancel
                      </button>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="card stack" style={{ gap: 14 }}>
            <div className="row-between">
              <h2 style={{ fontSize: 18 }}>Session history</h2>
              <span className="muted small">{completed.length} completed</span>
            </div>
            <ol className="history">
              {completed.map((s) => {
                const p = getUser(s.partnerId);
                return (
                  <li key={s.id}>
                    <span className="status-icon" style={{ background: 'var(--green-tint)', color: 'var(--green)' }}>
                      <Icon name="check" size={18} strokeWidth={2.6} />
                    </span>
                    <span className="stack small" style={{ flex: '1 1 160px', gap: 0 }}>
                      <strong>
                        {p.name.split(' ')[0]} · {s.note || s.focus}
                      </strong>
                      <span className="muted">
                        {formatShort(s.date)} · {s.duration} min · {s.mode}
                      </span>
                    </span>
                    {s.review ? (
                      <span className="small" style={{ fontWeight: 700 }}>
                        ★ {Number(s.review.rating).toFixed(1)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="tag tag-purple"
                        style={{ border: 0 }}
                        onClick={() => {
                          setReviewId(s.id);
                          notify(`Reviewing your session with ${p.name.split(' ')[0]}`, 'info');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Review due
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
