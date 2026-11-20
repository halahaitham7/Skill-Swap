import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import PartnerCard from '../components/PartnerCard.jsx';
import ToggleGroup from '../components/ToggleGroup.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useMatches } from '../hooks/useMatches.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { CATEGORIES } from '../data/skills.js';
import { describeAvailability, userCategories } from '../utils/matching.js';
import './Match.css';

const CATEGORY_OPTIONS = ['All', ...CATEGORIES.map((c) => c.name)];
const MAX_COMPARE = 3;

export default function Match() {
  useDocumentTitle('Find a skill partner');
  const { state } = useApp();
  const ranked = useMatches();
  const [params, setParams] = useSearchParams();
  const [method, setMethod] = useState('Any');
  const [perfectOnly, setPerfectOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [compare, setCompare] = useState(['john', 'ana']);

  const query = params.get('q') || '';
  const category = CATEGORY_OPTIONS.includes(params.get('category')) ? params.get('category') : 'All';

  const updateParam = (key, value, fallback) => {
    const next = new URLSearchParams(params);
    if (!value || value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranked.filter(({ user, match }) => {
      if (category !== 'All' && !userCategories(user).includes(category)) return false;
      if (perfectOnly && !match.perfect) return false;
      if (favoritesOnly && !state.favorites.includes(user.id)) return false;
      if (method !== 'Any' && user.method !== method && user.method !== 'Both') return false;
      if (q) {
        const hay = [user.name, user.location, ...user.teaches.map((s) => s.name), ...user.wants.map((s) => s.name)].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ranked, query, category, perfectOnly, favoritesOnly, method, state.favorites]);

  const toggleCompare = (id) =>
    setCompare((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length >= MAX_COMPARE ? list : [...list, id]));

  const compared = ranked.filter(({ user }) => compare.includes(user.id));

  const resetFilters = () => {
    setParams(new URLSearchParams(), { replace: true });
    setMethod('Any');
    setPerfectOnly(false);
    setFavoritesOnly(false);
  };

  return (
    <div className="container page" style={{ gap: 28 }}>
      <div className="row-between" style={{ alignItems: 'flex-end', gap: 20 }}>
        <div className="stack" style={{ gap: 10 }}>
          <h1 className="page-title" style={{ fontSize: 'clamp(30px, 3.6vw, 42px)' }}>
            Find your skill partner
          </h1>
          <div className="row small" style={{ gap: 8, fontWeight: 700 }}>
            <span className="muted" style={{ fontWeight: 600 }}>
              Matching on
            </span>
            <span className="chip chip-teach chip-lg">You teach · {state.profile.teach.map((s) => s.name).join(', ') || '—'}</span>
            <span className="chip chip-learn chip-lg">You learn · {state.profile.learn.map((s) => s.name).join(', ') || '—'}</span>
            <Link to="/signup">Edit</Link>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <label className="checkbox card" style={{ padding: '12px 16px', borderRadius: 14, fontWeight: 700, fontSize: 15 }}>
            <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
            Favorites
          </label>
          <label className="checkbox card" style={{ padding: '12px 16px', borderRadius: 14, fontWeight: 700, fontSize: 15 }}>
            <input type="checkbox" checked={perfectOnly} onChange={(e) => setPerfectOnly(e.target.checked)} />
            Perfect matches only
          </label>
        </div>
      </div>

      {/* Search + filters */}
      <div className="filters">
        <div className="row" style={{ alignItems: 'stretch' }}>
          <label className="input-icon">
            <Icon name="search" size={20} strokeWidth={2.2} />
            <span className="sr-only">Search skills or people</span>
            <input
              className="input soft"
              type="search"
              placeholder="Search a skill or name, e.g. Python, guitar, Ana"
              value={query}
              onChange={(e) => updateParam('q', e.target.value, '')}
            />
          </label>
          <div className="segmented" role="group" aria-label="Learning method">
            {['Any', 'Online', 'In person'].map((m) => (
              <button key={m} type="button" aria-pressed={method === m} onClick={() => setMethod(m)}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <ToggleGroup
          label="Skill category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(c) => updateParam('category', c, 'All')}
          variant="round purple"
        />
      </div>

      {/* Compare tray */}
      {compared.length > 0 && (
        <section className="compare" aria-label="Compare profiles">
          <div className="row-between">
            <h2 style={{ fontSize: 18 }}>
              Compare side by side{' '}
              <span style={{ color: '#A99BFF', fontWeight: 600 }}>
                · {compared.length} of {MAX_COMPARE}
              </span>
            </h2>
            <button type="button" className="btn btn-ghost" onClick={() => setCompare([])}>
              Clear
            </button>
          </div>
          <div className="compare-scroll">
            <div className="compare-grid">
              {compared.map(({ user, match }) => (
                <div key={user.id} className="compare-col">
                  <div className="row-between" style={{ flexWrap: 'nowrap' }}>
                    <Link to={`/profile/${user.id}`} className="row" style={{ gap: 10, color: '#fff', textDecoration: 'none', flexWrap: 'nowrap' }}>
                      <Avatar name={user.name} palette={user.palette} size={40} />
                      <span className="stack" style={{ gap: 0 }}>
                        <strong style={{ fontSize: 15 }}>{user.name}</strong>
                        <span className="tiny" style={{ color: 'var(--night-text)' }}>
                          {match.score}% match
                        </span>
                      </span>
                    </Link>
                    <button type="button" className="icon-btn" style={{ color: '#fff' }} aria-label={`Remove ${user.name} from comparison`} onClick={() => toggleCompare(user.id)}>
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                  <div>
                    <span style={{ color: '#A99BFF', fontWeight: 700 }}>Teaches </span>
                    {user.teaches.map((s) => s.name).join(', ')}
                  </div>
                  <div>
                    <span style={{ color: '#8EC2FF', fontWeight: 700 }}>Wants </span>
                    {user.wants.map((s) => s.name).join(', ')}
                  </div>
                  <div style={{ color: 'var(--night-text)' }}>
                    {user.method} · {describeAvailability(user.availability)}
                  </div>
                  <div style={{ color: 'var(--night-text)' }}>
                    ★ {user.rating.toFixed(1)} ({user.reviewCount} reviews) · {user.exchanges} exchanges
                  </div>
                </div>
              ))}
              {Array.from({ length: MAX_COMPARE - compared.length }).map((_, i) => (
                <div key={`empty-${i}`} className="compare-col placeholder">
                  Tick “Compare” on a card to add someone
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="row-between">
        <p className="muted" style={{ fontSize: 15 }} aria-live="polite">
          <strong style={{ color: 'var(--ink)' }}>
            {results.length} partner{results.length === 1 ? '' : 's'}
          </strong>{' '}
          · sorted by best match
        </p>
        <span className="row muted tiny" style={{ gap: 14 }}>
          <span className="row" style={{ gap: 6 }}>
            <span className="legend-swatch" style={{ background: 'var(--purple-tint)', border: '1.5px solid var(--purple)' }} />
            Teaches
          </span>
          <span className="row" style={{ gap: 6 }}>
            <span className="legend-swatch" style={{ background: '#fff', border: '1.5px dashed var(--blue-ink)' }} />
            Wants to learn
          </span>
          <span className="row" style={{ gap: 6 }}>
            <span className="legend-swatch" style={{ background: 'var(--purple)' }} />
            Matches your profile
          </span>
        </span>
      </div>

      {results.length > 0 ? (
        <div className="grid-auto" style={{ '--min': '340px' }}>
          {results.map(({ user, match }) => (
            <PartnerCard
              key={user.id}
              user={user}
              match={match}
              comparing={compare.includes(user.id)}
              compareDisabled={compare.length >= MAX_COMPARE}
              onToggleCompare={toggleCompare}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <strong style={{ fontSize: 20 }}>No partners match those filters yet</strong>
          <p className="muted">Try another category, or turn off “Perfect matches only”.</p>
          <button type="button" className="btn btn-primary" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
