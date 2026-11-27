import { revalidateTag, unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { publicShop } from "@/lib/shop";
import Shop from "@/models/Shop";

// Customer-facing shop data (name, logo, Google link, status) changes rarely,
// so it is cached by Next.js (Vercel's data cache, kept across deployments)
// instead of hitting the database on every QR scan.
//  - Admin changes clear it immediately (clearShopCache).
//  - Otherwise it refreshes at least every hour, so trials and paid periods
//    that end on their own still take effect within the hour (and the rating
//    API always checks the live status anyway).
export const SHOP_CACHE_SECONDS = 3600;

export const shopTag = (slug) => `shop:${String(slug).toLowerCase()}`;

/** Raw, JSON-safe shop fields for a slug (or null), cached per slug. */
export function getCachedShopBySlug(slug) {
  const key = String(slug).toLowerCase();
  return unstable_cache(
    async () => {
      await connectDB();
      const s = await Shop.findOne({ slug: key }).lean();
      if (!s) return null;
      return {
        _id: String(s._id),
        name: s.name,
        slug: s.slug,
        logoUrl: s.logoUrl || null,
        googlePlaceId: s.googlePlaceId || null,
        status: s.status,
        trialEndsAt: s.trialEndsAt ? s.trialEndsAt.toISOString() : null,
        paidUntil: s.paidUntil ? s.paidUntil.toISOString() : null,
        offersEnabled: Boolean(s.offersEnabled),
        publicPhone: s.publicPhone || null,
      };
    },
    ["public-shop-v3", key],
    { tags: [shopTag(key)], revalidate: SHOP_CACHE_SECONDS }
  )();
}

/** The customer-safe view of a shop (or null), from the cache. */
export async function getPublicShop(slug) {
  const s = await getCachedShopBySlug(slug);
  if (!s) return null;
  return publicShop({
    ...s,
    trialEndsAt: s.trialEndsAt ? new Date(s.trialEndsAt) : null,
    paidUntil: s.paidUntil ? new Date(s.paidUntil) : null,
  });
}

/**
 * Call after any admin change to a shop. Pass every slug involved (old and
 * new when the link name changes, or a brand-new shop's slug, whose "not
 * found" page may have been cached). The next visitor gets fresh data.
 */
export function clearShopCache(...slugs) {
  for (const slug of new Set(slugs.filter(Boolean).map((s) => String(s).toLowerCase()))) {
    revalidateTag(shopTag(slug), { expire: 0 });
  }
}
