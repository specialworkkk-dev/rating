import { fmtNum } from "@/lib/format";
import { card } from "./ui";
import { MoodLabel } from "./Mood";

const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const parse = (k) => new Date(k.length === 7 ? `${k}-01T00:00:00Z` : `${k}T00:00:00Z`);

function Tile({ label, value, sub, accent = "" }) {
  return (
    <div className={`${card} p-4 sm:p-5`}>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${accent}`}>{value}</p>
      {sub && <p className="mt-1 truncate text-xs text-muted">{sub}</p>}
    </div>
  );
}

/**
 * Headline numbers for the selected period, from the same per-day (or
 * per-month) running counts as the chart, so they always agree with it.
 */
export default function PeriodSummary({ series, unit = "day" }) {
  const t = series.reduce(
    (a, d) => ({ ratings: a.ratings + d.ratings, happy: a.happy + d.happy, stars: a.stars + (d.stars || 0), google: a.google + d.google }),
    { ratings: 0, happy: 0, stars: 0, google: 0 }
  );
  const avg = t.ratings ? t.stars / t.ratings : null;
  const happyPct = t.ratings ? Math.round((t.happy / t.ratings) * 100) : null;
  const busiest = t.ratings ? series.reduce((b, d) => (d.ratings > b.ratings ? d : b), series[0]) : null;
  const perBucket = series.length ? t.ratings / series.length : 0;
  const monthly = unit === "month";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile label="Ratings" value={fmtNum(t.ratings)} sub={`≈ ${fmtNum(Math.round(perBucket))} per ${monthly ? "month" : "day"}`} />
      <Tile
        label="Average rating"
        value={avg == null ? "—" : `${avg.toFixed(1)}★`}
        accent={avg == null ? "text-stone-300" : "text-brand-600"}
        sub={avg == null ? "No ratings yet" : "out of 5"}
      />
      <Tile
        label={<MoodLabel kind="happy">Happy customers</MoodLabel>}
        value={happyPct == null ? "—" : `${happyPct}%`}
        accent={happyPct == null ? "text-stone-300" : ""}
        sub={happyPct == null ? "4–5★ ratings" : `${fmtNum(t.happy)} gave 4–5★`}
      />
      <Tile
        label={monthly ? "Busiest month" : "Busiest day"}
        value={busiest ? fmtNum(busiest.ratings) : "—"}
        accent={busiest ? "" : "text-stone-300"}
        sub={busiest ? (monthly ? monthFmt.format(parse(busiest.date)) : dayFmt.format(parse(busiest.date))) : "No ratings yet"}
      />
    </div>
  );
}
