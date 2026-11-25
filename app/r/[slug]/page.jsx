import { notFound } from "next/navigation";
import RatingFlow from "@/components/RatingFlow";
import ShopHeader from "@/components/ShopHeader";
import { connectDB } from "@/lib/db";
import { BRAND } from "@/lib/brand";
import { publicShop } from "@/lib/shop";
import Unavailable from "./Unavailable";
import Shop from "@/models/Shop";

// Status (trial / paid / paused) must take effect immediately.
export const dynamic = "force-dynamic";

async function getShop(slug) {
  await connectDB();
  const shop = await Shop.findOne({ slug: String(slug).toLowerCase() }).lean();
  return shop ? publicShop(shop) : null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const shop = await getShop(slug);
  return {
    title: shop ? `Rate ${shop.name}` : "Not found",
    robots: { index: false, follow: false },
  };
}

export default async function RatePage({ params, searchParams }) {
  const { slug } = await params;
  const { src } = await searchParams;
  const shop = await getShop(slug);
  if (!shop) notFound();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-10 pb-8">
      <ShopHeader name={shop.name} logoUrl={shop.logoUrl} />
      {shop.active ? (
        <RatingFlow shop={shop} source={src === "nfc" ? "nfc" : "qr"} />
      ) : (
        <Unavailable shopName={shop.name} />
      )}
      <p className="mt-auto pt-10 text-center text-xs text-stone-400">Powered by {BRAND.name}</p>
    </main>
  );
}
