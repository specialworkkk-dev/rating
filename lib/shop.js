export function googleReviewUrl(placeId) {
  if (!placeId) return null;
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

/** A shop's rating page is live only while it is on a valid trial or paid plan. */
export function isShopActive(shop, now = new Date()) {
  if (!shop || shop.status === "paused") return false;
  if (shop.status === "trial") return !shop.trialEndsAt || shop.trialEndsAt > now;
  if (shop.status === "active") return !shop.paidUntil || shop.paidUntil > now;
  return false;
}

/** The fields that are safe to send to an anonymous customer. */
export function publicShop(shop) {
  const active = isShopActive(shop);
  return {
    id: String(shop._id),
    name: shop.name,
    slug: shop.slug,
    logoUrl: shop.logoUrl || null,
    active,
    googleReviewUrl: active ? googleReviewUrl(shop.googlePlaceId) : null,
  };
}

export const HAPPY_MIN_STARS = 4;
