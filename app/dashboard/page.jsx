import Link from "next/link";
import DashboardHero from "@/components/DashboardHero";
import FairReviewRules from "@/components/FairReviewRules";
import FairRulesAgree from "@/components/FairRulesAgree";
import GettingStarted from "@/components/GettingStarted";
import PausedNotice from "@/components/PausedNotice";
import QrPoster from "@/components/QrPoster";
import StatsCards from "@/components/StatsCards";
import { card, fmtDate } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { fmtNum } from "@/lib/format";
import { getOwnerContext } from "@/lib/ownerContext";
import { formatINR, shopPrice } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";
import { getDailySeries, getShopStats, hasAnyRating, normalizeRange, sinceFor } from "@/lib/stats";

export const metadata = { title: `Dashboard · ${BRAND.name}` };

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "all", label: "All time" },
];

export default async function DashboardPage({ searchParams }) {
  const { shop, paused } = await getOwnerContext();
  if (!shop) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className={card}>Your account isn’t linked to a shop yet. Please contact support.</p>
      </main>
    );
  }

  // While paused, the owner sees only the paused notice: clear, and no data shown.
  if (paused) {
    return (
      <main className="px-4 py-10 sm:py-16">
        <PausedNotice reason={paused} shopName={shop.name} endedAt={shop.status === "trial" ? shop.trialEndsAt : shop.paidUntil} />
      </main>
    );
  }

  const range = normalizeRange((await searchParams).range);
  const sparkDays = range === "7" ? 7 : 30;
  // Everything loads in parallel; the day-by-day series feeds the sparklines.
  const [stats, base, series, everRated] = await Promise.all([
    getShopStats(shop._id, sinceFor(range)),
    siteUrl(),
    getDailySeries(shop._id, sparkDays),
    hasAnyRating(shop._id),
  ]);
  const ratingUrl = `${base}/r/${shop.slug}`;
  const until = shop.status === "trial" ? shop.trialEndsAt : shop.paidUntil;
  const daysLeft = until ? Math.max(0, Math.ceil((new Date(until) - Date.now()) / 86400000)) : null;

  const planText =
    shop.status === "trial"
      ? `Free trial${daysLeft != null ? ` · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left` : ""}`
      : `${formatINR(shopPrice(shop))}/month${until ? ` · paid until ${fmtDate(until)}` : ""}`;

  const period = { 7: "In the last 7 days", 30: "In the last 30 days", all: "So far" }[range];
  const summary = stats.ratings
    ? `${period}, ${fmtNum(stats.ratings)} ${stats.ratings === 1 ? "customer" : "customers"} rated you ${stats.average.toFixed(1)}★, ${fmtNum(stats.googleClicks)} went on to Google${
        stats.unreadFeedback ? `, and you have ${fmtNum(stats.unreadFeedback)} unread ${stats.unreadFeedback === 1 ? "message" : "messages"}` : ""
      }.`
    : everRated
      ? `${period}, no new ratings yet. Make sure your QR poster is easy to see.`
      : "Your rating page is ready. Put up your QR poster and invite every customer to scan.";

  return (
    <>
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <DashboardHero shop={shop} planText={planText} summary={summary} ratingUrl={ratingUrl} unread={stats.unreadFeedback} />

        {!shop.rulesAcceptedAt && <FairRulesAgree />}
        {!everRated && <GettingStarted />}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <h2 className="text-lg font-semibold">Overview</h2>
          <div className="ml-auto flex rounded-xl bg-stone-200/60 p-1 text-sm">
            {RANGES.map((r) => (
              <Link
                key={r.key}
                href={`/dashboard?range=${r.key}`}
                scroll={false}
                className={`rounded-lg px-3 py-1.5 ${range === r.key ? "bg-white font-medium shadow-sm" : "text-stone-600 hover:text-ink"}`}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>

        <StatsCards stats={stats} series={series} />

        <Link
          href="/dashboard/ratings"
          prefetch={true}
          className={`${card} group flex items-center gap-4 transition-colors hover:ring-stone-300`}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Daily ratings</span>
            <span className="block text-sm text-muted">Day-by-day chart and detailed figures for any period</span>
          </span>
          <span className="text-stone-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
        </Link>

        <QrPoster
          endpoint="/api/dashboard/qr"
          ratingUrl={ratingUrl}
          version={`${shop.slug}-${shop.updatedAt?.getTime?.() ?? ""}`}
        />
        {shop.rulesAcceptedAt && (
          <details className={`${card} group`}>
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              Google’s review rules
              <span className="text-sm font-normal text-muted">
                Agreed {fmtDate(shop.rulesAcceptedAt)} · <span className="group-open:hidden">Show</span>
                <span className="hidden group-open:inline">Hide</span>
              </span>
            </summary>
            <div className="mt-4">
              <FairReviewRules />
            </div>
          </details>
        )}
      </main>
    </>
  );
}
