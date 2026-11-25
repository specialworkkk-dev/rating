// Each shop has its own monthly price, set by the admin. New shops start here.
export const DEFAULT_MONTHLY_PRICE = 499;
export const MAX_MONTHLY_PRICE = 1_000_000;

export function shopPrice(shop) {
  return Number.isFinite(shop?.monthlyPrice) ? shop.monthlyPrice : DEFAULT_MONTHLY_PRICE;
}

export function formatINR(amount) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
