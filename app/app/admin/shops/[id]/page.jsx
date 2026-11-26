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
import { getShopSpike } from "@/lib/spike";
import { getShopStats, getSuspiciousBursts, sinceFor } from "@/lib/stats";
import { getTotals } from "@/lib/totals";
import Feedback from "@/models/Feedback";
import Shop from "@/models/Shop";
import User from "@/models/User";

export const metadata = { title: "Shop · Admin" };

export default async function AdminShopPage({ params, searchParams }) {
  await requirePageRole("admin");
  const { id } = await params;
  const { created } = await searchParams;
  if (!mongoose.isValidObjectId(id)) notFound();

  const doc = await Shop.findById(id).lean();
  if (!doc) notFound();
  const owner = doc.ownerId ? await User.findById(doc.ownerId).select("name email").lean() : null;
  const shop = adminShop(doc, owner);
  const [stats, base, bursts, spike, totals, feedbackCount] = await Promise.all([
    getShopStats(doc._id, sinceFor("30")),
    siteUrl(),
    getSuspiciousBursts(doc._id),
    getShopSpike(doc._id),
    getTotals(doc._id),
    Feedback.countDocuments({ shopId: doc._id }),
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
        <p className="text-sm text-muted">
          Last 30 days: {stats.scans} scans · {stats.ratings} ratings
          {stats.average != null && ` · ${stats.average.toFixed(1)}★ avg`} · {stats.googleClicks} sent to
          Google · {stats.unhappy} unhappy ({stats.unreadFeedback} unread feedback)
        </p>
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
