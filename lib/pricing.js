// Each shop has its own monthly price, set by the admin. New shops start here.
export const DEFAULT_MONTHLY_PRICE = 499;
export const MAX_MONTHLY_PRICE = 1_000_000;

export const DEFAULT_OFFERS_PRICE = 199;
export const DEFAULT_OFFERS_LIMIT = 8;

/** The shop's base plan price per month. */
export function shopPrice(shop) {
  return Number.isFinite(shop?.monthlyPrice) ? shop.monthlyPrice : DEFAULT_MONTHLY_PRICE;
}

/** The Offers (premium) add-on price, or 0 when Offers is off. */
export function offersPrice(shop) {
  if (!shop?.offersEnabled) return 0;
  return Number.isFinite(shop?.offersPrice) ? shop.offersPrice : DEFAULT_OFFERS_PRICE;
}

/** What the shop pays per month in total: base + Offers. */
export const totalPrice = (shop) => shopPrice(shop) + offersPrice(shop);

export function formatINR(amount) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
