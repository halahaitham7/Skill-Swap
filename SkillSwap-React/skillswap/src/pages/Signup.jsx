import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import ToggleGroup from '../components/ToggleGroup.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { DAYS, LEVELS, METHODS, TIMES } from '../data/skills.js';
import { USERS } from '../data/users.js';
import { rankUsers } from '../utils/matching.js';
import './Signup.css';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function SkillEditor({ kind, skills, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const isTeach = kind === 'teach';

  const add = () => {
    const name = draft.trim();
    if (!name) return setError('Type a skill first.');
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return setError('You already added that skill.');
    onChange([...skills, { name, level: 'Beginner' }]);
    setDraft('');
    setError('');
    return undefined;
  };

  return (
    <>
      {skills.length === 0 && <p className="muted small">No skills yet — add at least one below.</p>}
      {skills.map((skill, index) => (
        <div key={skill.name} className={`skill-row ${kind}`}>
          <strong style={{ fontSize: 17 }}>{skill.name}</strong>
          <div className="row" style={{ gap: 6 }}>
            <ToggleGroup
              label={`${skill.name} level`}
              options={LEVELS}
              value={skill.level}
              variant={kind}
              onChange={(level) => onChange(skills.map((s, i) => (i === index ? { ...s, level } : s)))}
            />
            <button type="button" className="icon-btn" aria-label={`Remove ${skill.name}`} onClick={() => onChange(skills.filter((_, i) => i !== index))}>
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
      ))}
      <div className="skill-add">
        <label className="field" style={{ color: isTeach ? 'var(--purple-deep)' : 'var(--blue-deep)' }}>
          {isTeach ? 'Add a skill you can teach' : 'Add a skill you want to learn'}
          <input
            className={`input ${kind}`}
            type="text"
            placeholder={placeholder}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
        </label>
        <button type="button" className={`btn ${isTeach ? 'btn-primary' : 'btn-blue'}`} onClick={add}>
          <Icon name="plus" size={18} /> Add skill
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </>
  );
}

export default function Signup() {
  useDocumentTitle('Create your profile');
  const { state, updateProfile, notify } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({ ...state.profile }));
  const [errors, setErrors] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const matchCount = useMemo(
    () => rankUsers(form, USERS).filter(({ match }) => match.type === 'perfect' || match.type === 'wants').length,
    [form],
  );

  const onAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Please choose an image file (JPG or PNG).', 'warning');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      notify('That image is over 2 MB. Please choose a smaller one.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!form.teach.length) next.teach = 'Add at least one skill you can teach.';
    if (!form.learn.length) next.learn = 'Add at least one skill you want to learn.';
    if (!form.days.length || !form.times.length) next.availability = 'Pick at least one day and one time.';
    if (!form.agreed) next.agreed = 'Please accept the community guidelines.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) {
      notify('Please fix the highlighted fields.', 'warning');
      return;
    }
    updateProfile({ ...form, name: form.name.trim() });
    notify('Profile saved! Here are your matches.');
    navigate('/match');
  };

  const orderedDays = DAYS.filter((d) => form.days.includes(d));

  return (
    <div className="container page" style={{ paddingTop: 48 }}>
      <div className="stack" style={{ gap: 10 }}>
        <span className="eyebrow">About 2 minutes</span>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.035em' }}>Create your profile</h1>
        <p className="muted" style={{ fontSize: 18, maxWidth: 620 }}>
          The more we know about what you teach and what you want to learn, the better your matches.
        </p>
      </div>

      <div className="split">
        <form className="main" onSubmit={submit} noValidate>
          <fieldset className="form-section">
            <legend>About you</legend>
            <div className="upload-row">
              <Avatar name={form.name || '?'} palette={form.palette} src={form.avatar} size={88} />
              <div className="stack" style={{ gap: 8 }}>
                <div className="row" style={{ gap: 8 }}>
                  <label style={{ position: 'relative' }}>
                    <input className="file-input" type="file" accept="image/*" onChange={onAvatar} />
                    <span className="btn btn-tint">
                      <Icon name="upload" size={18} /> Upload profile picture
                    </span>
                  </label>
                  {form.avatar && (
                    <button type="button" className="btn btn-ghost" onClick={() => set('avatar')(null)}>
                      Remove
                    </button>
                  )}
                </div>
                <span className="muted tiny">JPG or PNG up to 2 MB. A clear photo of your face helps build trust.</span>
              </div>
            </div>
            <div className="grid-fit" style={{ '--min': '240px' }}>
              <label className="field">
                Full name
                <input className="input" type="text" value={form.name} onChange={(e) => set('name')(e.target.value)} aria-invalid={!!errors.name} required />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </label>
              <label className="field">
                <span>
                  Location <span className="hint">(optional)</span>
                </span>
                <input className="input" type="text" value={form.location} onChange={(e) => set('location')(e.target.value)} placeholder="City, Country" />
              </label>
            </div>
            <label className="field">
              Short bio
              <textarea className="input" rows={3} maxLength={280} value={form.bio} onChange={(e) => set('bio')(e.target.value)} />
              <span className="hint tiny">{280 - form.bio.length} characters left</span>
            </label>
          </fieldset>

          <fieldset className="form-section teach">
            <legend>
              <span className="legend-icon teach">
                <Icon name="teach" size={18} strokeWidth={2.4} />
              </span>
              Skills I Can Teach
            </legend>
            <p className="muted" style={{ fontSize: 15 }}>
              What could you show someone else? Pick your honest level.
            </p>
            <SkillEditor kind="teach" skills={form.teach} onChange={set('teach')} placeholder="e.g. Lightroom editing" />
            {errors.teach && <p className="field-error">{errors.teach}</p>}
          </fieldset>

          <fieldset className="form-section learn">
            <legend>
              <span className="legend-icon learn">
                <Icon name="learn" size={18} strokeWidth={2.4} />
              </span>
              Skills I Want to Learn
            </legend>
            <p className="muted" style={{ fontSize: 15 }}>
              What would you love to get better at? Tell us where you&apos;re starting.
            </p>
            <SkillEditor kind="learn" skills={form.learn} onChange={set('learn')} placeholder="e.g. Video editing" />
            {errors.learn && <p className="field-error">{errors.learn}</p>}
          </fieldset>

          <fieldset className="form-section">
            <legend>How &amp; when you learn</legend>
            <div className="stack" style={{ gap: 10 }}>
              <span className="small" style={{ fontWeight: 700 }}>
                Preferred learning method
              </span>
              <ToggleGroup label="Preferred learning method" options={METHODS} value={form.method} onChange={set('method')} variant="round" />
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <span className="small" style={{ fontWeight: 700 }}>
                Available days
              </span>
              <ToggleGroup label="Available days" options={DAYS} value={form.days} onChange={set('days')} variant="round" />
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <span className="small" style={{ fontWeight: 700 }}>
                Available times
              </span>
              <ToggleGroup label="Available times" options={TIMES} value={form.times} onChange={set('times')} variant="round" />
            </div>
            {errors.availability && <p className="field-error">{errors.availability}</p>}
          </fieldset>

          <div className="row-between">
            <div className="stack" style={{ gap: 4 }}>
              <label className="checkbox muted">
                <input type="checkbox" checked={form.agreed} onChange={(e) => set('agreed')(e.target.checked)} />I agree to the{' '}
                <Link to="/community#guidelines">community guidelines</Link>
              </label>
              {errors.agreed && <span className="field-error">{errors.agreed}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-pill btn-lg btn-glow">
              Save profile &amp; see matches
            </button>
          </div>
        </form>

        <aside className="side" aria-label="Profile preview">
          <span className="label-caps muted" style={{ fontSize: 13 }}>
            How others see you
          </span>
          <div className="preview-card">
            <div className="preview-banner" />
            <div className="preview-body">
              <Avatar name={form.name || '?'} palette={form.palette} src={form.avatar} size={80} ring />
              <div className="stack" style={{ gap: 4 }}>
                <strong style={{ fontSize: 20 }}>{form.name || 'Your name'}</strong>
                <span className="muted small">
                  {form.location || 'Location hidden'} · {form.method}
                </span>
              </div>
              {form.bio && <p className="small" style={{ color: 'var(--ink-2)', lineHeight: 1.55 }}>{form.bio}</p>}
              <div className="stack" style={{ gap: 8 }}>
                <span className="label-caps teach">Can teach</span>
                <div className="row" style={{ gap: 6 }}>
                  {form.teach.map((s) => (
                    <span key={s.name} className="chip chip-teach chip-lg">
                      {s.name} · {s.level}
                    </span>
                  ))}
                  {!form.teach.length && <span className="muted tiny">Nothing yet</span>}
                </div>
              </div>
              <div className="stack" style={{ gap: 8 }}>
                <span className="label-caps learn">Wants to learn</span>
                <div className="row" style={{ gap: 6 }}>
                  {form.learn.map((s) => (
                    <span key={s.name} className="chip chip-learn chip-lg">
                      {s.name} · {s.level}
                    </span>
                  ))}
                  {!form.learn.length && <span className="muted tiny">Nothing yet</span>}
                </div>
              </div>
              <div className="row muted small" style={{ gap: 8, borderTop: '1px solid var(--line-2)', paddingTop: 14 }}>
                <Icon name="calendar" size={18} />
                <span>
                  {orderedDays.length ? orderedDays.join(', ') : 'No days yet'}
                  {form.times.length ? ` · ${TIMES.filter((t) => form.times.includes(t)).join(', ')}` : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="row" style={{ background: 'var(--purple-tint)', borderRadius: 20, padding: '18px 20px', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
            <span style={{ color: 'var(--purple-ink)', marginTop: 2 }}>
              <Icon name="swap" size={20} strokeWidth={2.2} />
            </span>
            <p className="small" style={{ color: 'var(--purple-deep)', lineHeight: 1.55 }}>
              <strong>
                {matchCount} {matchCount === 1 ? 'person is' : 'people are'}
              </strong>{' '}
              already looking for what you teach{matchCount ? ' — and some offer what you want to learn' : ''}.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
