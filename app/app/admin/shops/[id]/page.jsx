import { POSTER_DESIGN } from "@/lib/posterDesign";
import mongoose from "mongoose";
import Link from "next/link";
import { notFound } from "next/navigation";
import BillingPanel from "@/components/BillingPanel";
import CopyButton from "@/components/CopyButton";
import DeleteShopPanel from "@/components/DeleteShopPanel";
import OwnerForm from "@/components/OwnerForm";
import QrPoster from "@/components/QrPoster";
import ShopContactCard from "@/components/ShopContactCard";
import ShopForm from "@/components/ShopForm";
import SpikeWarning from "@/components/SpikeWarning";
import SuspiciousPanel from "@/components/SuspiciousPanel";
import { btnSecondary, card } from "@/components/ui";
import { requirePageRole } from "@/lib/session";
import { adminShop } from "@/lib/shopInput";
import { siteUrl } from "@/lib/site";
import { getTermsVersion } from "@/lib/tokenSettings";
import { getShopSpike } from "@/lib/spike";
import StatsCards from "@/components/StatsCards";
import { fmtNum } from "@/lib/format";
import { getDailySeries, getShopStats, getSuspiciousBursts, normalizeRange, sinceFor } from "@/lib/stats";
import { getTotals } from "@/lib/totals";
import Feedback from "@/models/Feedback";
import Shop from "@/models/Shop";
import User from "@/models/User";

export const metadata = { title: "Shop · Admin" };

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "all", label: "All time" },
];

export default async function AdminShopPage({ params, searchParams }) {
  await requirePageRole("admin");
  const { id } = await params;
  const { created, range: rangeParam } = await searchParams;
  const range = normalizeRange(rangeParam);
  if (!mongoose.isValidObjectId(id)) notFound();

  const doc = await Shop.findById(id).lean();
  if (!doc) notFound();
  const owner = doc.ownerId ? await User.findById(doc.ownerId).select("name email").lean() : null;
  const shop = adminShop(doc, owner, await getTermsVersion());
  const [stats, base, bursts, spike, totals, feedbackCount, series] = await Promise.all([
    getShopStats(doc._id, sinceFor(range)),
    siteUrl(),
    getSuspiciousBursts(doc._id),
    getShopSpike(doc._id),
    getTotals(doc._id),
    Feedback.countDocuments({ shopId: doc._id }),
    getDailySeries(doc._id, range === "7" ? 7 : 30),
  ]);
  const ratingUrl = `${base}/r/${shop.slug}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/app/admin" className="inline-block text-sm text-stone-600 hover:text-ink">
        ← All shops
      </Link>
      <h1 className="text-xl font-bold">{shop.name}</h1>

      {created && (
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
          Shop created with a 15-day free trial. Next, create the owner login below.
        </p>
      )}

      <section className={`${card} space-y-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-lg bg-stone-100 px-3 py-2 text-sm break-all">{ratingUrl}</code>
          <CopyButton text={ratingUrl} />
          <a href={ratingUrl} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
            Open
          </a>
        </div>
      </section>

      {/* The shop's figures: the same cards and star breakdown its owner sees. */}
      <section id="figures" className="scroll-mt-20 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold">Ratings &amp; figures</h2>
            {stats.unreadFeedback > 0 && (
              <p className="text-xs text-muted">{fmtNum(stats.unreadFeedback)} unread feedback for the owner</p>
            )}
          </div>
          <div className="ml-auto flex rounded-xl bg-stone-200/60 p-1 text-sm">
            {RANGES.map((r) => (
              <Link
                key={r.key}
                href={`/app/admin/shops/${shop.id}?range=${r.key}#figures`}
                scroll={false}
                replace
                aria-current={range === r.key ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 whitespace-nowrap ${range === r.key ? "bg-white font-medium shadow-sm" : "text-stone-600 hover:text-ink"}`}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
        <StatsCards stats={stats} series={series} narrow />
      </section>

      <SpikeWarning spike={spike} variant="admin" />
      <ShopContactCard shopId={shop.id} contact={shop.contact} />
      <SuspiciousPanel shopId={shop.id} bursts={bursts} />
      <BillingPanel shop={shop} />
      <QrPoster
        endpoint={`/api/admin/shops/${shop.id}/qr`}
        ratingUrl={ratingUrl}
        version={`${shop.slug}-${doc.updatedAt?.getTime?.() ?? ""}-${POSTER_DESIGN}`}
      />
      <OwnerForm
        shopId={shop.id}
        owner={shop.owner}
        rulesAcceptedAt={shop.rulesAcceptedAt}
        rulesAcceptedVia={shop.rulesAcceptedVia}
        termsAgreed={shop.termsAgreed}
        termsAcceptedAt={shop.termsAcceptedAt}
      />
      <ShopForm shop={shop} />
      <DeleteShopPanel
        shop={shop}
        counts={{ ratings: totals.ratings, feedback: feedbackCount, scans: totals.scans + (totals.direct || 0) }}
      />
    </div>
  );
}
