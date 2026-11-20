import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { CATEGORIES } from '../data/skills.js';
import { getUser } from '../data/users.js';
import { computeMatch } from '../utils/matching.js';
import './Home.css';

const STEPS = [
  { num: '01', icon: 'teach', tone: 'tone-purple', title: 'Share Your Skills', text: 'Tell people what you can teach, from sourdough to Spanish, and set your level so learners know what to expect.' },
  { num: '02', icon: 'learn', tone: 'tone-blue', title: 'Choose What You Want to Learn', text: "Add the skills you want to improve, how you like to learn (online or in person) and when you're free." },
  { num: '03', icon: 'swap', tone: '', title: 'Find Your Match', text: 'We connect you with someone who wants what you teach and teaches what you want. Say hi, book a session, swap.', dark: true },
];

const STORIES = [
  { name: 'Omar Farouk', palette: 4, swap: 'Cooking ⇄ Graphic Design', quote: 'I taught Mei how to bake bread and she redesigned the logo for my supper club. Best trade I’ve ever made.' },
  { name: 'Lucía Romero', palette: 5, swap: 'Spanish ⇄ Python', quote: 'Six sessions in and I’ve shipped my first Python script. Lukas gets weekly Spanish practice out of it.' },
  { name: 'Priya Nair', palette: 2, swap: 'Marketing ⇄ Music', quote: 'Guitar lessons cost a fortune. On SkillSwap I pay in marketing advice, which I give out for free anyway.' },
];

function HeroPerson({ name, palette, place, teach, learn }) {
  return (
    <div className="hero-person lift">
      <Avatar name={name} palette={palette} size={56} />
      <div className="stack" style={{ gap: 8, flex: '1 1 auto', minWidth: 0 }}>
        <div className="row-between" style={{ gap: 8 }}>
          <strong style={{ fontSize: 17 }}>{name}</strong>
          <span className="muted tiny">{place}</span>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className="chip chip-teach">Teaches · {teach}</span>
          <span className="chip chip-learn">Learning · {learn}</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  useDocumentTitle('');
  const navigate = useNavigate();
  const { state, sendRequest } = useApp();
  const [teach, setTeach] = useState('');
  const [learn, setLearn] = useState('');

  const john = getUser('john');
  const johnMatch = useMemo(() => computeMatch(state.profile, john), [state.profile, john]);
  const connected = state.connections.some((c) => c.userId === 'john');
  const requested = state.sentRequests.includes('john');

  const submitQuickMatch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (learn.trim()) params.set('q', learn.trim());
    else if (teach.trim()) params.set('q', teach.trim());
    navigate(`/match${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-pill">
              <Icon name="swap" size={16} strokeWidth={2.2} />
              Skill exchange, not tuition
            </span>
            <h1>
              Your Skills Are Someone Else&apos;s <span className="gradient-text">Missing Piece.</span>
            </h1>
            <p className="hero-sub">Teach what you know. Learn what you love. Exchange skills and grow together.</p>
            <div className="row">
              <Link className="btn btn-primary btn-pill btn-lg btn-glow" to="/match">
                <Icon name="search" size={20} strokeWidth={2.2} />
                Find Your Skill Partner
              </Link>
              <Link className="btn btn-outline btn-pill btn-lg" to="/signup">
                <Icon name="plus" size={20} strokeWidth={2.2} />
                Share Your Skills
              </Link>
            </div>
            <p className="muted small">Free to join · No course fees · Online or in person</p>
          </div>

          <div className="hero-visual" aria-label="Example match between Sarah and John">
            <HeroPerson name="Sarah Malik" palette={0} place="Lisbon · Online" teach="Photography" learn="English" />
            <div className="hero-connector">
              <span className="match-badge lg">
                <Icon name="check" size={18} strokeWidth={2.4} />
                Match Found! · 100%
              </span>
            </div>
            <HeroPerson name="John Carter" palette={1} place="Manchester · Online" teach="English" learn="Photography" />
            <p className="muted small" style={{ textAlign: 'center', marginTop: 16 }}>
              Sarah teaches John photography. John teaches Sarah English. Nobody pays.
            </p>
          </div>
        </div>

        <div className="container quick-match">
          <form onSubmit={submitQuickMatch} aria-label="Quick match">
            <label className="field" style={{ color: 'var(--purple-ink)' }}>
              I can teach
              <input className="input soft" type="text" placeholder="e.g. Photography" value={teach} onChange={(e) => setTeach(e.target.value)} />
            </label>
            <span className="swap-icon" aria-hidden="true">
              <Icon name="swap" size={22} />
            </span>
            <label className="field" style={{ color: 'var(--blue-ink)' }}>
              I want to learn
              <input className="input learn" type="text" placeholder="e.g. English" value={learn} onChange={(e) => setLearn(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-dark btn-lg" style={{ margin: 4 }}>
              Show my matches
            </button>
          </form>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container section">
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2 className="section-title">Three steps to your first exchange</h2>
          <p>No fees and no lesson plans to buy. Just two people swapping what they know.</p>
        </div>
        <div className="grid-fit" style={{ '--min': '280px', '--gap': '24px' }}>
          {STEPS.map((step) => (
            <article key={step.num} className={`${step.dark ? 'card-dark dark' : 'card'} step-card lift`}>
              <div className="row-between">
                <span className={`step-icon ${step.tone}`} style={step.dark ? { background: 'var(--gradient-diag)', color: '#fff' } : undefined}>
                  <Icon name={step.icon} size={28} />
                </span>
                <span className="step-num" style={{ color: step.dark ? '#3B3470' : step.tone === 'tone-blue' ? '#D6E6FB' : '#E3DEFB' }}>
                  {step.num}
                </span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Matching showcase */}
      <section className="showcase">
        <div className="container showcase-inner">
          <div className="showcase-copy">
            <span className="eyebrow" style={{ color: '#A99BFF' }}>
              Smart matching
            </span>
            <h2 className="section-title">Matches that work both ways</h2>
            <p>A match only counts when each person can teach what the other wants to learn. Then we rank by schedule, level and learning style.</p>
            <ul className="showcase-list">
              {[
                ['Two-way skill fit', 'first, then everything else'],
                ['Shared free time', 'so sessions are easy to book'],
                ['Online or in person', 'matched to how you like to learn'],
              ].map(([strong, rest]) => (
                <li key={strong}>
                  <span className="check-dot">
                    <Icon name="check" size={16} strokeWidth={2.6} />
                  </span>
                  <span>
                    <strong>{strong}</strong> <span style={{ color: 'var(--night-text)' }}>{rest}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link className="btn btn-white btn-pill" style={{ alignSelf: 'flex-start' }} to="/match">
              Browse partners
            </Link>
          </div>

          <div className="showcase-card">
            <div className="row-between">
              <strong style={{ fontSize: 18 }}>You &amp; {john.name}</strong>
              {johnMatch.perfect ? <span className="match-badge">Match Found!</span> : <span className="tag tag-gray">{johnMatch.score}% match</span>}
            </div>
            <div className="grid-2">
              <div className="swap-box" style={{ background: 'var(--purple-tint)' }}>
                <span className="label-caps teach" style={{ fontSize: 12 }}>
                  You teach John
                </span>
                <strong style={{ fontSize: 18 }}>{john.wants[0].name}</strong>
                <span className="muted tiny">{state.profile.teach.find((s) => s.name === john.wants[0].name)?.level || 'Add it to your skills'}</span>
              </div>
              <div className="swap-box" style={{ background: 'var(--blue-tint)' }}>
                <span className="label-caps learn" style={{ fontSize: 12 }}>
                  John teaches you
                </span>
                <strong style={{ fontSize: 18 }}>{john.teaches[0].name}</strong>
                <span className="muted tiny">Native · Conversation</span>
              </div>
            </div>
            <div className="stack" style={{ gap: 12 }}>
              {[
                ['Skill fit', johnMatch.perfect ? 'Both ways' : 'One way', johnMatch.perfect ? 100 : 50],
                ['Schedule overlap', `${johnMatch.overlap.length} shared time slot${johnMatch.overlap.length === 1 ? '' : 's'}`, Math.min(100, johnMatch.overlap.length * 34)],
                ['Learning method', johnMatch.methodOk ? 'Compatible' : 'Different', johnMatch.methodOk ? 100 : 30],
              ].map(([label, value, pct]) => (
                <div key={label} className="stack" style={{ gap: 6 }}>
                  <div className="row-between small">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                  <ProgressBar value={pct} label={label} />
                </div>
              ))}
            </div>
            <div className="row" style={{ gap: 10 }}>
              <Link className="btn btn-soft" style={{ flex: '1 1 140px' }} to="/profile/john">
                View profile
              </Link>
              {connected ? (
                <Link className="btn btn-primary" style={{ flex: '1 1 140px' }} to="/messages/john">
                  Open chat
                </Link>
              ) : (
                <button type="button" className={`btn ${requested ? 'btn-success' : 'btn-primary'}`} style={{ flex: '1 1 140px' }} disabled={requested} onClick={() => sendRequest('john')}>
                  {requested ? 'Request sent ✓' : 'Send request'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Popular skills */}
      <section id="skills" className="container section" style={{ gap: 40 }}>
        <div className="row-between" style={{ alignItems: 'flex-end' }}>
          <div className="stack" style={{ gap: 12 }}>
            <span className="eyebrow">Popular skills</span>
            <h2 className="section-title">What people are swapping</h2>
          </div>
          <Link to="/match" style={{ fontWeight: 700 }}>
            See all skills
          </Link>
        </div>
        <div className="grid-auto">
          {CATEGORIES.map((cat) => (
            <Link key={cat.name} className="category-card lift" to={`/match?category=${encodeURIComponent(cat.name)}`}>
              <span className={`category-icon tone-${cat.tone}`}>
                <Icon name={cat.icon} size={26} />
              </span>
              <strong style={{ fontSize: 19 }}>{cat.name}</strong>
              <span className="muted small">{cat.examples}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Stories */}
      <section className="stories">
        <div className="container section" style={{ gap: 40, paddingTop: 88, paddingBottom: 88 }}>
          <h2 style={{ fontSize: 'clamp(28px, 3.2vw, 40px)', letterSpacing: '-0.03em' }}>Swaps from the community</h2>
          <div className="grid-fit" style={{ '--min': '300px', '--gap': '20px' }}>
            {STORIES.map((s) => (
              <figure key={s.name} className="story">
                <blockquote>“{s.quote}”</blockquote>
                <figcaption className="row" style={{ gap: 12 }}>
                  <Avatar name={s.name} palette={s.palette} size={44} />
                  <span className="stack small" style={{ gap: 0 }}>
                    <strong>{s.name}</strong>
                    <span className="muted">{s.swap}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Closing message */}
      <section className="container" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <div className="cta">
          <h2>Don&apos;t pay to learn everything. Exchange what you know for what you want to learn.</h2>
          <p>Create your profile in two minutes and see who&apos;s waiting to swap with you.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link className="btn btn-white btn-pill btn-lg" style={{ color: 'var(--purple-deep)', fontWeight: 800 }} to="/signup">
              Share Your Skills
            </Link>
            <Link className="btn btn-cta-ghost btn-pill btn-lg" to="/match">
              Find Your Skill Partner
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
