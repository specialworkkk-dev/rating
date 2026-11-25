import Link from "next/link";
import ActivityChart from "@/components/ActivityChart";
import AppHeader from "@/components/AppHeader";
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
import { ownerLinks } from "@/lib/ownerNav";
import { requirePageRole } from "@/lib/session";
import { formatINR, shopPrice } from "@/lib/pricing";
import { pauseReason } from "@/lib/shop";
import { siteUrl } from "@/lib/site";
import { getDailySeries, getMonthlySeries, getShopStats, hasAnyRating, normalizeRange, sinceFor } from "@/lib/stats";
import Shop from "@/models/Shop";

export const metadata = { title: `Dashboard · ${BRAND.name}` };

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "all", label: "All time" },
];

export default async function DashboardPage({ searchParams }) {
  const user = await requirePageRole("owner"); // admins are sent to /admin

  const shop = user.shopId ? await Shop.findById(user.shopId).lean() : null;
  if (!shop) {
    return (
      <>
        <AppHeader user={user} />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <p className={card}>Your account isn’t linked to a shop yet. Please contact support.</p>
        </main>
      </>
    );
  }

  // While paused, the owner sees only the paused notice: clear, and no data shown.
  const paused = pauseReason(shop);
  if (paused) {
    return (
      <>
        <AppHeader user={user} shop={shop} showBell={false} />
        <main className="px-4 py-10 sm:py-16">
          <PausedNotice
            reason={paused}
            shopName={shop.name}
            endedAt={shop.status === "trial" ? shop.trialEndsAt : shop.paidUntil}
          />
        </main>
      </>
    );
  }

  const range = normalizeRange((await searchParams).range);
  const chartDays = range === "7" ? 7 : 30;
  const [stats, base, series, everRated] = await Promise.all([
    getShopStats(shop._id, sinceFor(range)),
    siteUrl(),
    getDailySeries(shop._id, chartDays),
    hasAnyRating(shop._id),
  ]);
  // 7 and 30 days: a bar per day. All time: a bar per month (last 12 months),
  // because 365 daily bars would be unreadable.
  const monthly = range === "all";
  const chartSeries = monthly ? await getMonthlySeries(shop._id, 12) : series;
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
      <AppHeader user={user} shop={shop} badge={stats.unreadFeedback} links={ownerLinks(stats.unreadFeedback)} />
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

        <StatsCards
          stats={stats}
          series={series}
          chart={
            <ActivityChart
              series={chartSeries}
              unit={monthly ? "month" : "day"}
              title={monthly ? "Last 12 months" : chartDays === 7 ? "Last 7 days" : "Last 30 days"}
            />
          }
        />

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
