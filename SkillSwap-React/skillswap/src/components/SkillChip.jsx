/**
 * Teach chips are solid purple; learn chips are dashed blue outlines,
 * so "Skills I can teach" and "Skills I want to learn" never look alike.
 * `hit` highlights a skill that matches the viewer's own profile.
 */
export default function SkillChip({ name, kind = 'teach', level, hit = false, large = false, prefix }) {
  const classes = ['chip', kind === 'teach' ? 'chip-teach' : 'chip-learn', hit ? 'hit' : '', large ? 'chip-lg' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes}>
      {prefix && <span>{prefix} ·</span>}
      {name}
      {level && <span style={{ opacity: 0.85 }}>· {level}</span>}
    </span>
  );
}
