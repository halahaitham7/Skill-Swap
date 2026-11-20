import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import Icon, { StarIcon } from './Icon.jsx';
import MatchBadge from './MatchBadge.jsx';
import SkillChip from './SkillChip.jsx';
import ProgressBar from './ProgressBar.jsx';
import { useApp } from '../context/AppContext.jsx';

/** Interactive match card used on the Find Partners page. */
export default function PartnerCard({ user, match, comparing, onToggleCompare, compareDisabled }) {
  const { state, toggleFavorite, sendRequest, cancelRequest } = useApp();
  const fav = state.favorites.includes(user.id);
  const sent = state.sentRequests.includes(user.id);
  const connected = state.connections.some((c) => c.userId === user.id);
  const firstName = user.name.split(' ')[0];

  return (
    <article className={`partner-card lift${match.perfect ? ' perfect' : ''}`}>
      <div className="row-between" style={{ gap: 8 }}>
        <MatchBadge type={match.type} />
        <div className="row" style={{ gap: 2 }}>
          <label className="checkbox tiny" style={{ fontWeight: 700, color: 'var(--muted)', padding: '10px 6px' }}>
            <input type="checkbox" checked={comparing} disabled={!comparing && compareDisabled} onChange={() => onToggleCompare(user.id)} />
            Compare
          </label>
          <button
            type="button"
            className="icon-btn fav-btn"
            aria-pressed={fav}
            aria-label={fav ? `Remove ${user.name} from favorites` : `Save ${user.name} to favorites`}
            onClick={() => toggleFavorite(user.id)}
          >
            <Icon name="heart" fill={fav ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <Link to={`/profile/${user.id}`} className="partner-identity">
        <Avatar name={user.name} palette={user.palette} size={60} />
        <span className="stack" style={{ gap: 4, minWidth: 0 }}>
          <strong style={{ fontSize: 18 }}>{user.name}</strong>
          <span className="muted small">
            {user.location} · {user.method}
          </span>
          <span className="row small" style={{ gap: 4, fontWeight: 700 }}>
            <StarIcon size={15} /> {user.rating.toFixed(1)}
            <span className="muted" style={{ fontWeight: 500 }}>
              ({user.reviewCount})
            </span>
          </span>
        </span>
      </Link>

      <div className="grid-2">
        <div className="stack" style={{ gap: 6 }}>
          <span className="label-caps teach">Can teach</span>
          <div className="row" style={{ gap: 6 }}>
            {user.teaches.map((s) => (
              <SkillChip key={s.name} name={s.name} kind="teach" hit={match.theyTeachForMe.includes(s.name)} />
            ))}
          </div>
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <span className="label-caps learn">Wants to learn</span>
          <div className="row" style={{ gap: 6 }}>
            {user.wants.map((s) => (
              <SkillChip key={s.name} name={s.name} kind="learn" hit={match.theyWantFromMe.includes(s.name)} />
            ))}
          </div>
        </div>
      </div>

      <div className="stack" style={{ gap: 6 }}>
        <div className="row-between tiny">
          <span className="muted">{match.reason}</span>
          <strong>{match.score}%</strong>
        </div>
        <ProgressBar value={match.score} variant={match.perfect ? '' : 'soft'} label={`Match score ${match.score}%`} />
      </div>

      <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
        <Link className="btn btn-soft" style={{ flex: '1 1 0' }} to={`/profile/${user.id}`}>
          View profile
        </Link>
        {connected ? (
          <Link className="btn btn-success" style={{ flex: '1 1 0' }} to={`/messages/${user.id}`}>
            Message
          </Link>
        ) : (
          <button
            type="button"
            className={`btn ${sent ? 'btn-success' : 'btn-primary'}`}
            style={{ flex: '1 1 0' }}
            aria-pressed={sent}
            onClick={() => (sent ? cancelRequest(user.id) : sendRequest(user.id))}
            title={sent ? `Withdraw request to ${firstName}` : undefined}
          >
            {sent ? 'Request sent ✓' : 'Connect'}
          </button>
        )}
      </div>
    </article>
  );
}
