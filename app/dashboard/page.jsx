import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import FairReviewRules from "@/components/FairReviewRules";
import FairRulesAgree from "@/components/FairRulesAgree";
import FeedbackList from "@/components/FeedbackList";
import PausedNotice from "@/components/PausedNotice";
import QrPoster from "@/components/QrPoster";
import StatsCards from "@/components/StatsCards";
import { card, fmtDate } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { requirePageRole } from "@/lib/session";
import { formatINR, shopPrice } from "@/lib/pricing";
import { pauseReason } from "@/lib/shop";
import { siteUrl } from "@/lib/site";
import { getFeedbackList, getShopStats, normalizeRange, sinceFor } from "@/lib/stats";
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
        <AppHeader title="Dashboard" user={user} />
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
        <AppHeader title={shop.name} user={user} />
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
  const [stats, feedback, base] = await Promise.all([
    getShopStats(shop._id, sinceFor(range)),
    getFeedbackList(shop._id),
    siteUrl(),
  ]);
  const ratingUrl = `${base}/r/${shop.slug}`;
  const until = shop.status === "trial" ? shop.trialEndsAt : shop.paidUntil;

  return (
    <>
      <AppHeader title={shop.name} user={user} badge={stats.unreadFeedback} />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-stone-200/60 p-1 text-sm">
            {RANGES.map((r) => (
              <Link
                key={r.key}
                href={`/dashboard?range=${r.key}`}
                className={`rounded-md px-3 py-1 ${range === r.key ? "bg-white font-medium shadow-sm" : "text-stone-600"}`}
              >
                {r.label}
              </Link>
            ))}
          </div>
          <p className="ml-auto text-sm text-muted">
            {shop.status === "trial" ? (
              <>Free trial{until ? ` until ${fmtDate(until)}` : ""}</>
            ) : (
              <>
                Plan <span className="font-medium text-ink">{formatINR(shopPrice(shop))}/month</span>
                {until ? ` · paid until ${fmtDate(until)}` : ""}
              </>
            )}
          </p>
        </div>

        {!shop.rulesAcceptedAt && <FairRulesAgree />}

        <StatsCards stats={stats} />

        <FeedbackList initial={feedback} />

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
