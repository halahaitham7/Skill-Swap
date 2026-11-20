import { AVATAR_PALETTES } from '../data/skills.js';
import { initialsOf } from '../data/users.js';

/** Circular avatar: shows the uploaded photo when there is one, otherwise initials. */
export default function Avatar({ name, palette = 0, src, size = 44, online = false, ring = false, className = '' }) {
  const colors = AVATAR_PALETTES[palette % AVATAR_PALETTES.length];
  const style = {
    width: size,
    height: size,
    background: colors.bg,
    color: colors.fg,
    fontSize: Math.max(12, Math.round(size / 3)),
    border: ring ? `${Math.max(3, Math.round(size / 20))}px solid #fff` : undefined,
  };
  return (
    <span className={`avatar ${className}`} style={style} aria-hidden="true">
      {src ? <img src={src} alt="" /> : initialsOf(name)}
      {online && <span className="online" />}
    </span>
  );
}
