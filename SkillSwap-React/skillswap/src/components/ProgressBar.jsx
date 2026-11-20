export default function ProgressBar({ value, variant = '', label }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`progress ${variant}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}
