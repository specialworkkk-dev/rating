import { card } from "./ui";

function Stat({ label, value, hint, accent }) {
  return (
    <div className={card}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${accent || ""}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default function StatsCards({ stats }) {
  const max = Math.max(1, ...Object.values(stats.breakdown));
  const pct = (n) => (stats.ratings ? Math.round((n / stats.ratings) * 100) : 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Scans" value={stats.scans} hint="QR / NFC opens" />
        <Stat label="Ratings" value={stats.ratings} />
        <Stat
          label="Average"
          value={stats.average == null ? "—" : `${stats.average.toFixed(1)}★`}
          accent="text-brand-600"
        />
        <Stat
          label="Sent to Google"
          value={stats.googleClicks}
          hint="tapped “Post on Google”"
        />
      </div>

      <div className={card}>
        <h2 className="font-semibold">Ratings breakdown</h2>
        <ul className="mt-3 space-y-2">
          {[5, 4, 3, 2, 1].map((s) => {
            const n = stats.breakdown[s];
            return (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className="w-8 shrink-0 tabular-nums">{s}★</span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <span
                    className={`block h-full rounded-full ${s >= 4 ? "bg-brand-500" : "bg-red-400"}`}
                    style={{ width: `${(n / max) * 100}%` }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right tabular-nums text-muted">
                  {n} · {pct(n)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
