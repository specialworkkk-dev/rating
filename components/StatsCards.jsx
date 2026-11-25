import AnimatedBar from "./AnimatedBar";
import CountUp from "./CountUp";
import Sparkline from "./Sparkline";
import { card } from "./ui";

// Diverging scale (validated): blue for happy, neutral grey midpoint, red for
// unhappy. Readable with colour blindness, unlike green-to-red.
const STAR_COLORS = { 5: "#1c5cab", 4: "#5598e7", 3: "#aeaba4", 2: "#e66767", 1: "#c23434" };

const pct = (part, whole) => (whole ? (part / whole) * 100 : 0);

const ICONS = {
  scan: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z",
  star: "M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z",
  avg: "M4 19h16M7 15l3-4 3 2 4-6",
  google: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
};

function Icon({ name, tone }) {
  const filled = name === "star" || name === "scan";
  return (
    <span className={`hidden size-9 shrink-0 items-center justify-center rounded-xl sm:flex ${tone}`}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path
          d={ICONS[name]}
          fill={filled ? "currentColor" : "none"}
          stroke={filled ? "none" : "currentColor"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function Stat({ icon, tone, label, children, hint, trend, trendLabel }) {
  return (
    <div className={`${card} flex flex-col gap-3 p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium leading-tight text-muted">{label}</p>
        <Icon name={icon} tone={tone} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-bold tracking-tight">{children}</p>
        {trend && (
          <span className="hidden sm:block">
            <Sparkline values={trend} label={trendLabel} />
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Five stars, filled proportionally to the average (e.g. 3.5 → three and a half). */
function StarMeter({ value }) {
  const fill = value == null ? 0 : (value / 5) * 100;
  const row = (cls) => (
    <span className={`flex gap-0.5 ${cls}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
          <path d={ICONS.star} fill="currentColor" />
        </svg>
      ))}
    </span>
  );
  return (
    <span className="relative inline-block" aria-label={value == null ? "No ratings" : `${value} out of 5`}>
      {row("text-stone-200")}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill}%` }}>
        {row("text-brand-500")}
      </span>
    </span>
  );
}

export default function StatsCards({ stats, series = [], chart = null }) {
  // A flat line of zeros says nothing, so trends appear once there is activity.
  const trend = (key) => {
    const values = series.map((d) => d[key]);
    return values.length > 1 && values.some((v) => v > 0) ? values : null;
  };
  const happy = stats.breakdown[4] + stats.breakdown[5];
  const ratedOfScans = Math.min(100, Math.round(pct(stats.ratings, stats.scans)));
  const googleOfRatings = Math.round(pct(stats.googleClicks, stats.ratings));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="scan" tone="bg-sky-50 text-sky-600" label="Scans" hint="QR / NFC opens" trend={trend("scans")} trendLabel="Scans per day">
          <CountUp value={stats.scans} />
        </Stat>
        <Stat
          icon="star"
          tone="bg-brand-50 text-brand-600"
          label="Ratings"
          hint={stats.scans ? `${ratedOfScans}% of scans rated` : "No scans yet"}
          trend={trend("ratings")}
          trendLabel="Ratings per day"
        >
          <CountUp value={stats.ratings} />
        </Stat>
        <Stat
          icon="avg"
          tone="bg-emerald-50 text-emerald-600"
          label="Average"
          hint={stats.ratings ? `${happy} happy · ${stats.unhappy} unhappy` : "No ratings yet"}
        >
          {stats.average == null ? (
            <span className="text-stone-300">—</span>
          ) : (
            <span className="text-brand-600">
              <CountUp value={stats.average} decimals={1} suffix="★" />
            </span>
          )}
        </Stat>
        <Stat
          icon="google"
          tone="bg-violet-50 text-violet-600"
          label="Sent to Google"
          hint={stats.ratings ? `${googleOfRatings}% of ratings` : "Tapped “Post on Google”"}
          trend={trend("google")}
          trendLabel="Sent to Google per day"
        >
          <CountUp value={stats.googleClicks} />
        </Stat>
      </div>

      {chart}

      <section className={card}>
        <h2 className="font-semibold">Ratings breakdown</h2>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-stone-50 px-8 py-5 text-center sm:w-48">
            <p className="text-5xl font-bold tracking-tight">
              {stats.average == null ? (
                <span className="text-stone-300">—</span>
              ) : (
                <CountUp value={stats.average} decimals={1} />
              )}
            </p>
            <div className="mt-2">
              <StarMeter value={stats.average} />
            </div>
            <p className="mt-1.5 text-sm text-muted">
              <CountUp value={stats.ratings} /> {stats.ratings === 1 ? "rating" : "ratings"}
            </p>
          </div>

          <ul className="min-w-0 flex-1 space-y-3">
            {[5, 4, 3, 2, 1].map((s, i) => {
              const n = stats.breakdown[s];
              const p = pct(n, stats.ratings);
              return (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className="flex w-7 shrink-0 items-center gap-0.5 font-medium tabular-nums">
                    {s}
                    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
                      <path d={ICONS.star} fill={STAR_COLORS[s]} />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <AnimatedBar
                      percent={p}
                      color={STAR_COLORS[s]}
                      delay={i * 90}
                      label={`${s} star: ${n} ratings, ${Math.round(p)}%`}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right font-medium tabular-nums">
                    <CountUp value={n} delay={i * 90} />
                  </span>
                  <span className="w-11 shrink-0 text-right text-muted tabular-nums">
                    <CountUp value={Math.round(p)} suffix="%" delay={i * 90} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
