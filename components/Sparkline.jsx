/**
 * A small trend line (one series, so no legend): de-emphasised grey line with
 * a 10% wash, and the latest value marked in the accent colour.
 */
export default function Sparkline({ values, label, width = 112, height = 32 }) {
  if (!values?.length) return null;
  const max = Math.max(1, ...values);
  const pad = 5;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => [pad + i * step, pad + (height - pad * 2) * (1 - v / max)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts.at(-1)[0].toFixed(1)} ${height - pad} L${pad} ${height - pad} Z`;
  const [lx, ly] = pts.at(-1);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="shrink-0">
      <path d={area} fill="#a8a29e" opacity="0.1" />
      <path d={line} fill="none" stroke="#a8a29e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="4" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}
