import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export default function Logo({ size = 40, to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="SkillSwap home">
      <span className="logo-mark" style={{ width: size, height: size }}>
        <Icon name="swap" size={Math.round(size * 0.55)} strokeWidth={2.2} />
      </span>
      <span className="logo-text" style={{ fontSize: size >= 40 ? 22 : 20 }}>
        SkillSwap
      </span>
    </Link>
  );
}
