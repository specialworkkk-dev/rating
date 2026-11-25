// A usage bar for a plan limit. The fill colour shows how full it is, and a
// text label always says the same thing (colour is never the only signal).
const LEVELS = {
  ok: { fill: "#257de0", track: "#dbe9fa", text: "text-[#006c10]", icon: "✓", label: "Plenty of room" },
  warning: { fill: "#fbb315", track: "#fef1d0", text: "text-amber-800", icon: "⚠", label: "Getting full" },
  critical: { fill: "#dc3c3d", track: "#f8dada", text: "text-red-700", icon: "⛔", label: "Almost full" },
};

export function LevelLabel({ level }) {
  const l = LEVELS[level] || LEVELS.ok;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${l.text}`}>
      <span aria-hidden="true">{l.icon}</span>
      {l.label}
    </span>
  );
}

export default function UsageMeter({ percent, level, marker, markerLabel, label }) {
  const l = LEVELS[level] || LEVELS.ok;
  // A tiny but real amount still shows a sliver.
  const width = percent > 0 ? Math.min(100, Math.max(percent, 0.8)) : 0;
  return (
    <div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(percent, 100))}
        className="relative h-3 w-full rounded-full"
        style={{ backgroundColor: l.track }}
      >
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: l.fill }} />
        {marker != null && marker > percent && (
          <div
            className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-stone-700"
            style={{ left: `calc(${Math.min(marker, 100)}% - 1px)` }}
            title={markerLabel}
          />
        )}
      </div>
    </div>
  );
}
