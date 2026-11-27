import { notFound } from "next/navigation";
import FollowOffers from "@/components/FollowOffers";
import RatingFlow from "@/components/RatingFlow";
import ShopHeader from "@/components/ShopHeader";
import { BRAND } from "@/lib/brand";
import { INLINE_ICON } from "@/lib/inlineIcon";
import { getPublicShop, SHOP_CACHE_SECONDS } from "@/lib/shopCache";
import Unavailable from "./Unavailable";

// Served from Vercel's network and rebuilt in the background: at most every
// hour, and immediately when the admin changes the shop (see clearShopCache).
// Nothing here may read cookies, headers or search params, or the page would
// have to be rendered on every scan.
export const revalidate = 3600; // = SHOP_CACHE_SECONDS (must be a literal)
export const dynamicParams = true;

export async function generateStaticParams() {
  return []; // built on first visit, then cached
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  return {
    title: shop ? `Rate ${shop.name}` : "Not found",
    robots: { index: false, follow: false },
    // Icon inside the page: no separate request on the busiest page.
    icons: { icon: INLINE_ICON },
    // Shops with Offers: iPhone needs a home-screen app to show notifications.
    ...(shop?.offers
      ? { manifest: `/r/${shop.slug}/manifest.webmanifest`, appleWebApp: { capable: true, title: shop.name, statusBarStyle: "default" } }
      : {}),
  };
}

export default async function RatePage({ params }) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) notFound();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-10 pb-8">
      <ShopHeader name={shop.name} logoUrl={shop.logoUrl} />
      {shop.active ? <RatingFlow shop={shop} /> : <Unavailable shopName={shop.name} />}
      {/* Separate from rating on purpose: no stars, reviews or Google here. */}
      {shop.offers && <FollowOffers slug={shop.slug} shopName={shop.name} />}
      <p className="mt-auto pt-10 text-center text-xs text-stone-400">
        Powered by {BRAND.name} ·{" "}
        <a href="/privacy" className="underline">
          Privacy
        </a>{" "}
        ·{" "}
        <a href="/terms" className="underline">
          Terms
        </a>
      </p>
    </main>
  );
}

// Keep the constant in one place even though `revalidate` must be a literal.
if (revalidate !== SHOP_CACHE_SECONDS) throw new Error("revalidate must equal SHOP_CACHE_SECONDS");
