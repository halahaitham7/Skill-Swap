import { StarIcon } from './Icon.jsx';

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

/** Read-only when `onChange` is omitted; otherwise five accessible star buttons. */
export default function StarRating({ value, onChange, size = 32 }) {
  if (!onChange) {
    const rounded = Math.round(value);
    return (
      <span className="row" style={{ gap: 2 }} role="img" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} size={size} color={n <= rounded ? '#E8A400' : '#DAD6EA'} />
        ))}
      </span>
    );
  }

  return (
    <div role="group" aria-label="Rating" className="row" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="icon-btn"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-pressed={value === n}
          onClick={() => onChange(n)}
        >
          <StarIcon size={size} color={n <= value ? '#E8A400' : '#DAD6EA'} />
        </button>
      ))}
      <span style={{ marginLeft: 8, fontWeight: 700 }}>{WORDS[value]}</span>
    </div>
  );
}
