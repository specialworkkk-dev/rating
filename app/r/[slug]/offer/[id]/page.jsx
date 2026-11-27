import mongoose from "mongoose";
import { notFound } from "next/navigation";
import OfferCard from "@/components/OfferCard";
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

export default async function OfferPage({ params }) {
  const { slug, id } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) notFound();

  let offer = null;
  if (mongoose.isValidObjectId(id)) {
    await connectDB();
    offer = await Offer.findOne({ _id: id, shopId: shop.id }).select("text endsAt sentAt imageUrl code").lean();
  }
  // endsAt is stored as the end of the "valid till" day in India.
  const ended = offer?.endsAt && new Date(offer.endsAt) < new Date();
  const available = offer && !ended && shop.active;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-10 pb-8">
      <ShopHeader name={shop.name} logoUrl={shop.logoUrl} />
      <OfferCard
        shopName={shop.name}
        mapsUrl={shop.mapsUrl}
        phone={shop.publicPhone}
        text={offer?.text}
        endsAt={offer?.endsAt}
        imageUrl={offer?.imageUrl}
        code={offer?.code}
        available={Boolean(available)}
      />
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
