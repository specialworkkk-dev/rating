import CountUp from "./CountUp";
import RatingsDonut from "./RatingsDonut";
import Sparkline from "./Sparkline";
import { card } from "./ui";

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

export default function StatsCards({ stats, series = [] }) {
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

      <section className={card}>
        <div className="mb-6 flex flex-wrap items-baseline gap-x-3">
          <h2 className="font-semibold">Ratings breakdown</h2>
          <p className="text-sm text-muted">How customers rated you in this period</p>
        </div>
        <RatingsDonut breakdown={stats.breakdown} total={stats.ratings} average={stats.average ?? 0} />
      </section>
    </div>
  );
}
