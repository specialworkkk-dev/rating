import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import FeedbackList from "@/components/FeedbackList";
import QrPoster from "@/components/QrPoster";
import StatsCards from "@/components/StatsCards";
import { card, fmtDate } from "@/components/ui";
import { requirePageRole } from "@/lib/session";
import { isShopActive } from "@/lib/shop";
import { siteUrl } from "@/lib/site";
import { getFeedbackList, getShopStats, normalizeRange, sinceFor } from "@/lib/stats";
import Shop from "@/models/Shop";

export const metadata = { title: "Dashboard · Review Booster" };

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

  const range = normalizeRange((await searchParams).range);
  const [stats, feedback, base] = await Promise.all([
    getShopStats(shop._id, sinceFor(range)),
    getFeedbackList(shop._id),
    siteUrl(),
  ]);
  const ratingUrl = `${base}/r/${shop.slug}`;
  const active = isShopActive(shop);
  const until = shop.status === "trial" ? shop.trialEndsAt : shop.paidUntil;

  return (
    <>
      <AppHeader title={shop.name} user={user} badge={stats.unreadFeedback} />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        {!active && (
          <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
            Your rating page is <strong>paused</strong>, so customers can’t rate you right now.
            Renew your plan to switch it back on.
          </p>
        )}

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
            {shop.status === "trial" ? "Free trial" : shop.status === "active" ? "Plan" : "Paused"}
            {until && shop.status !== "paused" ? ` until ${fmtDate(until)}` : ""}
          </p>
        </div>

        <StatsCards stats={stats} />

        <FeedbackList initial={feedback} />

        <QrPoster
          endpoint="/api/dashboard/qr"
          ratingUrl={ratingUrl}
          version={`${shop.slug}-${shop.updatedAt?.getTime?.() ?? ""}`}
        />
      </main>
    </>
  );
}
