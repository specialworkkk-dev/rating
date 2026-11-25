/** "Not available" illustration: a circle with a diagonal line through it. */
export default function UnavailableIcon({ tone = "stone", className = "size-24" }) {
  const tones = {
    stone: { ring: "#e7e5e4", line: "#a8a29e", bg: "#f5f5f4" },
    red: { ring: "#fecaca", line: "#dc2626", bg: "#fef2f2" },
  }[tone];
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      <circle cx="48" cy="48" r="46" fill={tones.bg} />
      <circle cx="48" cy="48" r="26" fill="none" stroke={tones.line} strokeWidth="7" />
      <path d="M30 66 L66 30" stroke={tones.line} strokeWidth="7" strokeLinecap="round" />
      <circle cx="48" cy="48" r="46" fill="none" stroke={tones.ring} strokeWidth="2" />
    </svg>
  );
}
