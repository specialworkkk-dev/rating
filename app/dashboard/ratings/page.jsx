import Link from "next/link";
import ActivityChart from "@/components/ActivityChart";
import ActivityTable from "@/components/ActivityTable";
import PausedNotice from "@/components/PausedNotice";
import PeriodSummary from "@/components/PeriodSummary";
import { card } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { getOwnerContext } from "@/lib/ownerContext";
import { getDailySeries, getMonthlySeries, normalizeRange } from "@/lib/stats";

export const metadata = { title: `Daily ratings · ${BRAND.name}` };

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "all", label: "12 months" },
];

/** Page 2 for owners: the day-by-day chart and the detailed figures table. */
export default async function DailyRatingsPage({ searchParams }) {
  const { shop, paused } = await getOwnerContext();
  if (!shop) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className={card}>Your account isn’t linked to a shop yet. Please contact support.</p>
      </main>
    );
  }
  if (paused) {
    return (
      <main className="px-4 py-10 sm:py-16">
        <PausedNotice reason={paused} shopName={shop.name} endedAt={shop.status === "trial" ? shop.trialEndsAt : shop.paidUntil} />
      </main>
    );
  }

  // 7 and 30 days: a bar per day. 12 months: a bar per month (365 daily bars
  // would be unreadable).
  const range = normalizeRange((await searchParams).range);
  const monthly = range === "all";
  const series = monthly ? await getMonthlySeries(shop._id, 12) : await getDailySeries(shop._id, range === "7" ? 7 : 30);

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Daily ratings</h1>
          <p className="mt-1 text-sm text-muted md:text-base">How many customers rated you each day, and how happy they were.</p>
        </div>
        <div className="flex w-full rounded-xl bg-stone-200/60 p-1 text-sm md:w-auto">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/dashboard/ratings?range=${r.key}`}
              scroll={false}
              className={`flex-1 rounded-lg px-3 py-1.5 text-center md:flex-none ${range === r.key ? "bg-white font-medium shadow-sm" : "text-stone-600 hover:text-ink"}`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <PeriodSummary series={series} unit={monthly ? "month" : "day"} />

      <ActivityChart
        showAverage
        heading={monthly ? "Ratings per month" : "Ratings per day"}
        series={series}
        unit={monthly ? "month" : "day"}
        title={monthly ? "Last 12 months" : range === "7" ? "Last 7 days" : "Last 30 days"} />

      <section className={card}>
        <div className="mb-4">
          <h2 className="font-semibold">Detailed figures</h2>
          <p className="text-sm text-muted">Pick any period, day by day or month by month.</p>
        </div>
        <ActivityTable />
      </section>
    </main>
  );
}
