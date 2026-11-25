import { getDays, istDayKey } from "@/lib/totals";
import ShopDay from "@/models/ShopDay";

// A "Google spike" is a day with far more Google taps than the shop's normal
// level: at least SPIKE_MIN taps and at least SPIKE_RATIO times the average
// over the previous BASE_DAYS days. Google's spam filters distrust sudden
// jumps (typical of review drives) and may remove genuine reviews.
export const SPIKE_MIN = 10;
export const SPIKE_RATIO = 3;
export const BASE_DAYS = 28;

const DAY_MS = 864e5;
const keyDaysAgo = (n) => istDayKey(new Date(Date.now() - n * DAY_MS));

/**
 * @param googleByDay { "YYYY-MM-DD": taps }
 * @returns { day, count, normal, label: "today" | "yesterday" } or null
 */
export function detectSpike(googleByDay) {
  const today = keyDaysAgo(0);
  const yesterday = keyDaysAgo(1);
  // Baseline: the BASE_DAYS days before yesterday (so neither checked day skews it).
  let sum = 0;
  for (let i = 2; i < 2 + BASE_DAYS; i++) sum += googleByDay[keyDaysAgo(i)] || 0;
  const normal = sum / BASE_DAYS;
  for (const [day, label] of [[today, "today"], [yesterday, "yesterday"]]) {
    const count = googleByDay[day] || 0;
    if (count >= SPIKE_MIN && count >= SPIKE_RATIO * Math.max(1, normal)) {
      return { day, count, normal: Math.round(normal * 10) / 10, label };
    }
  }
  return null;
}

/** Spike for one shop (from its per-day running counts). */
export async function getShopSpike(shopId) {
  const days = await getDays(shopId, keyDaysAgo(BASE_DAYS + 1), keyDaysAgo(0));
  return detectSpike(Object.fromEntries(Object.entries(days).map(([k, d]) => [k, (d.google || 0) + (d.direct || 0)])));
}

/** Spikes for every shop at once (admin overview), keyed by shop id. */
export async function getSpikesByShop() {
  const rows = await ShopDay.aggregate([
    { $match: { day: { $gte: keyDaysAgo(BASE_DAYS + 1) }, $or: [{ google: { $gt: 0 } }, { direct: { $gt: 0 } }] } },
    { $group: { _id: "$shopId", days: { $push: { k: "$day", v: { $add: [{ $ifNull: ["$google", 0] }, { $ifNull: ["$direct", 0] }] } } } } },
  ]);
  const out = {};
  for (const r of rows) {
    const spike = detectSpike(Object.fromEntries(r.days.map((d) => [d.k, d.v])));
    if (spike) out[String(r._id)] = spike;
  }
  return out;
}
