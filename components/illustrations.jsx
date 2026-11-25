// Inline SVG illustrations: crisp at any size, no image files to load.
const STAR = "M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z";

function StarAt({ x, y, s = 1, fill = "#f59e0b" }) {
  return <path d={STAR} fill={fill} transform={`translate(${x} ${y}) scale(${s})`} />;
}

/** Hero: a phone showing the rating screen, with a QR card and floating stars. */
export function HeroIllustration({ className = "w-full" }) {
  return (
    <svg viewBox="0 0 320 240" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hi-phone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f5f5f4" />
        </linearGradient>
        <filter id="hi-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>
      {/* QR card behind */}
      <g transform="rotate(-8 92 150)" filter="url(#hi-shadow)">
        <rect x="36" y="92" width="112" height="132" rx="14" fill="#fff8eb" />
        <rect x="56" y="112" width="72" height="72" rx="8" fill="#fff" stroke="#f59e0b" strokeWidth="3" />
        {[[62, 118], [104, 118], [62, 160]].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="18" height="18" rx="3" fill="#1c1917" />
            <rect x={x + 5} y={y + 5} width="8" height="8" rx="1.5" fill="#fff" />
          </g>
        ))}
        {[[86, 120], [92, 128], [86, 140], [100, 144], [110, 150], [94, 156], [106, 164], [86, 170], [114, 172], [100, 176]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1" fill="#1c1917" />
        ))}
        <rect x="62" y="196" width="60" height="8" rx="4" fill="#f59e0b" />
      </g>
      {/* Phone */}
      <g filter="url(#hi-shadow)">
        <rect x="150" y="18" width="124" height="214" rx="22" fill="#1c1917" />
        <rect x="157" y="25" width="110" height="200" rx="16" fill="url(#hi-phone)" />
        <rect x="196" y="31" width="32" height="6" rx="3" fill="#1c1917" />
        <rect x="196" y="52" width="32" height="32" rx="9" fill="#feeac7" />
        <rect x="178" y="92" width="68" height="7" rx="3.5" fill="#1c1917" />
        <rect x="186" y="104" width="52" height="5" rx="2.5" fill="#d6d3d1" />
        {[0, 1, 2, 3, 4].map((i) => (
          <StarAt key={i} x={169 + i * 18} y={120} s={0.72} />
        ))}
        <rect x="170" y="150" width="84" height="22" rx="11" fill="#f59e0b" />
        <rect x="188" y="158" width="48" height="6" rx="3" fill="#fff" />
        <rect x="170" y="180" width="84" height="22" rx="11" fill="#fff" stroke="#e7e5e4" strokeWidth="1.5" />
        <rect x="192" y="188" width="40" height="6" rx="3" fill="#a8a29e" />
      </g>
      {/* Floating accents */}
      <StarAt x={276} y={34} s={1.05} />
      <StarAt x={128} y={30} s={0.7} fill="#fbbf24" />
      <circle cx="292" cy="120" r="5" fill="#f59e0b" opacity="0.6" />
      <circle cx="132" cy="78" r="3.5" fill="#fff" opacity="0.5" />
      <g transform="translate(262 168)">
        <rect width="52" height="34" rx="12" fill="#fff" filter="url(#hi-shadow)" />
        <path d="M12 34 l-4 8 l12 -8z" fill="#fff" />
        <text x="26" y="23" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1c1917">4.8</text>
      </g>
    </svg>
  );
}

/** Empty inbox: no complaints. */
export function InboxIllustration({ className = "h-28" }) {
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden="true">
      <ellipse cx="80" cy="100" rx="56" ry="6" fill="#f5f5f4" />
      <path d="M30 52 L80 20 L130 52 V92 a6 6 0 0 1 -6 6 H36 a6 6 0 0 1 -6 -6z" fill="#fff" stroke="#e7e5e4" strokeWidth="2" />
      <rect x="46" y="30" width="68" height="46" rx="6" fill="#fff8eb" stroke="#feeac7" strokeWidth="2" />
      <rect x="56" y="40" width="40" height="5" rx="2.5" fill="#fcd9a3" />
      <rect x="56" y="50" width="48" height="5" rx="2.5" fill="#feeac7" />
      <path d="M30 52 L80 82 L130 52 V92 a6 6 0 0 1 -6 6 H36 a6 6 0 0 1 -6 -6z" fill="#fafaf9" stroke="#e7e5e4" strokeWidth="2" />
      <circle cx="122" cy="26" r="16" fill="#1c5cab" />
      <path d="M114 26 l5 5 l10 -10" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Empty chart: no ratings in this period yet. */
export function ChartEmptyIllustration({ className = "h-24" }) {
  return (
    <svg viewBox="0 0 160 96" className={className} aria-hidden="true">
      <line x1="16" y1="84" x2="144" y2="84" stroke="#e7e5e4" strokeWidth="2" strokeLinecap="round" />
      {[[30, 52], [52, 38], [74, 60], [96, 30], [118, 46]].map(([x, h], i) => (
        <rect key={x} x={x} y={84 - h} width="14" height={h} rx="4" fill={i === 3 ? "#feeac7" : "#f5f5f4"} />
      ))}
      <path d={STAR} fill="#f59e0b" transform="translate(94 14) scale(0.8)" />
    </svg>
  );
}

/** Small step icons for the getting-started card. */
export function StepIcon({ name }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      {name === "print" && (
        <>
          <path {...common} d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
          <path {...common} d="M7 14h10v7H7z" />
        </>
      )}
      {name === "place" && <path {...common} d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />}
      {name === "ask" && <path {...common} d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12zM8.5 12h.01M12 12h.01M15.5 12h.01" />}
    </svg>
  );
}
