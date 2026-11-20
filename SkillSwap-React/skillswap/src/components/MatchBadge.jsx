import Icon from './Icon.jsx';
import { MATCH_LABELS } from '../utils/matching.js';

const TAG_CLASS = {
  wants: 'tag tag-purple',
  teaches: 'tag tag-blue',
  buddy: 'tag tag-green',
  other: 'tag tag-gray',
};

/** "Match Found!" gradient badge for perfect matches, a softer tag for the rest. */
export default function MatchBadge({ type, score, large = false }) {
  if (type === 'perfect') {
    return (
      <span className={`match-badge${large ? ' lg' : ''}`}>
        <Icon name="check" size={large ? 18 : 14} strokeWidth={3} />
        Match Found!{score != null && ` · ${score}%`}
      </span>
    );
  }
  return <span className={TAG_CLASS[type] || TAG_CLASS.other}>{MATCH_LABELS[type]}</span>;
}
