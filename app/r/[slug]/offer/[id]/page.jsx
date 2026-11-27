import mongoose from "mongoose";
import { notFound } from "next/navigation";
import ShopHeader from "@/components/ShopHeader";
import UnfollowOffers from "@/components/UnfollowOffers";
import { BRAND } from "@/lib/brand";
import { connectDB } from "@/lib/db";
import { getPublicShop } from "@/lib/shopCache";
import Offer from "@/models/Offer";

// What a customer sees after tapping an offer notification. On purpose there
// are no stars, no review request and no Google button on this page.
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const dateFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export default async function OfferPage({ params }) {
  const { slug, id } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) notFound();

  let offer = null;
  if (mongoose.isValidObjectId(id)) {
    await connectDB();
    offer = await Offer.findOne({ _id: id, shopId: shop.id }).select("text endsAt sentAt").lean();
  }
  // endsAt is stored as the end of the "valid till" day in India.
  const ended = offer?.endsAt && new Date(offer.endsAt) < new Date();
  const available = offer && !ended && shop.active;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-10 pb-8">
      <ShopHeader name={shop.name} logoUrl={shop.logoUrl} />
      <section className="mt-6 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200">
        {available ? (
          <>
            <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Offer</p>
            <p className="mt-3 text-2xl leading-snug font-bold whitespace-pre-line">{offer.text}</p>
            {offer.endsAt && <p className="mt-3 text-sm text-muted">Valid till {dateFmt.format(new Date(offer.endsAt))}</p>}
            {shop.mapsUrl && (
              <a
                href={shop.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-3.5 font-semibold text-white"
              >
                📍 Directions to {shop.name}
              </a>
            )}
          </>
        ) : (
          <>
            <p className="text-3xl" aria-hidden="true">
              🕊️
            </p>
            <p className="mt-2 text-lg font-semibold">This offer is no longer available</p>
            <p className="mt-1 text-sm text-muted">It has ended or was removed by {shop.name}.</p>
          </>
        )}
      </section>
      <UnfollowOffers slug={shop.slug} shopName={shop.name} />
      <p className="mt-auto pt-10 text-center text-xs text-stone-400">
        Powered by {BRAND.name} ·{" "}
        <a href="/privacy" className="underline">
          Privacy
        </a>
      </p>
    </main>
  );
}
