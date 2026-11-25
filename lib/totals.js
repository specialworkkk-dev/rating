import mongoose from "mongoose";
import Rating from "../models/Rating.js";
import Scan from "../models/Scan.js";
import ShopMonth from "../models/ShopMonth.js";
import ShopTotals from "../models/ShopTotals.js";

/**
 * Apply +/- changes to a shop's running totals, e.g.
 * bumpTotals(shopId, { ratings: 1, "stars.5": 1 }). Never blocks the request
 * on failure: `npm run migrate` can always recompute exact numbers.
 */
export async function bumpTotals(shopId, inc) {
  const clean = Object.fromEntries(Object.entries(inc).filter(([, v]) => v));
  if (!Object.keys(clean).length) return;
  try {
    // No upsert: if a shop has no totals yet, getTotals() computes them exactly
    // from the raw data on first read. Creating them here would start from 0
    // and silently drop the shop's history.
    await ShopTotals.updateOne({ _id: shopId }, { $inc: clean });
  } catch (err) {
    console.error("[totals] bump failed", err?.message);
  }
}

/** Recompute a shop's totals exactly from the raw ratings and scans. */
export async function recomputeTotals(shopId) {
  const sid = new mongoose.Types.ObjectId(String(shopId));
  const [rows, scans] = await Promise.all([
    Rating.aggregate([
      { $match: { shopId: sid } },
      { $project: { _id: 0, stars: 1, clickedGoogle: 1 } },
      { $group: { _id: "$stars", n: { $sum: 1 }, google: { $sum: { $cond: ["$clickedGoogle", 1, 0] } } } },
    ]),
    Scan.countDocuments({ shopId: sid }),
  ]);
  const stars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratings = 0;
  let google = 0;
  for (const r of rows) {
    stars[r._id] = r.n;
    ratings += r.n;
    google += r.google;
  }
  const doc = { ratings, stars, google, scans, recomputedAt: new Date() };
  await ShopTotals.updateOne({ _id: sid }, { $set: doc }, { upsert: true });
  return doc;
}

/** All-time totals for a shop (computed once if missing). */
export async function getTotals(shopId) {
  const doc = await ShopTotals.findById(shopId).lean();
  return doc || recomputeTotals(shopId);
}

// ---------------------------------------------------------------------------
// Per-month running counts (for the monthly chart).
const TZ = "Asia/Kolkata";
const monthFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" });

/** "YYYY-MM" of a date in Indian time. */
export function istMonthKey(date) {
  return monthFmt.format(new Date(date)).slice(0, 7);
}

/** Add +/- counts to one shop-month, e.g. bumpMonth(id, createdAt, { happy: 1 }). */
export async function bumpMonth(shopId, date, inc) {
  const clean = Object.fromEntries(Object.entries(inc).filter(([, v]) => v));
  if (!Object.keys(clean).length) return;
  const month = istMonthKey(date);
  try {
    await ShopMonth.updateOne(
      { _id: `${shopId}:${month}` },
      { $inc: clean, $setOnInsert: { shopId, month } },
      { upsert: true }
    );
  } catch (err) {
    console.error("[totals] month bump failed", err?.message);
  }
}

export const moodOf = (stars) => (stars >= 4 ? "happy" : "unhappy");

/** Rebuild a shop's per-month counts exactly from the raw ratings and scans. */
export async function recomputeMonths(shopId) {
  const sid = new mongoose.Types.ObjectId(String(shopId));
  const month = { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: TZ } };
  const [ratings, scans] = await Promise.all([
    Rating.aggregate([
      { $match: { shopId: sid } },
      { $project: { _id: 0, createdAt: 1, stars: 1, clickedGoogle: 1 } },
      {
        $group: {
          _id: month,
          happy: { $sum: { $cond: [{ $gte: ["$stars", 4] }, 1, 0] } },
          unhappy: { $sum: { $cond: [{ $lt: ["$stars", 4] }, 1, 0] } },
          google: { $sum: { $cond: ["$clickedGoogle", 1, 0] } },
        },
      },
    ]),
    Scan.aggregate([
      { $match: { shopId: sid } },
      { $project: { _id: 0, createdAt: 1 } },
      { $group: { _id: month, n: { $sum: 1 } } },
    ]),
  ]);

  const rows = {};
  const row = (m) => (rows[m] ??= { _id: `${sid}:${m}`, shopId: sid, month: m, happy: 0, unhappy: 0, google: 0, scans: 0 });
  for (const r of ratings) Object.assign(row(r._id), { happy: r.happy, unhappy: r.unhappy, google: r.google });
  for (const s of scans) row(s._id).scans = s.n;

  await ShopMonth.deleteMany({ shopId: sid });
  if (Object.keys(rows).length) await ShopMonth.insertMany(Object.values(rows), { ordered: false });
  await getTotals(sid); // make sure the exact totals document exists first
  await ShopTotals.updateOne({ _id: sid }, { $set: { monthsReady: true } });
}

/** The given months' counts for a shop (builds them once if needed). */
export async function getMonths(shopId, months) {
  const sid = new mongoose.Types.ObjectId(String(shopId));
  const t = await ShopTotals.findById(sid).select("monthsReady").lean();
  if (!t?.monthsReady) await recomputeMonths(sid);
  const docs = await ShopMonth.find({ shopId: sid, month: { $in: months } }).lean();
  return Object.fromEntries(docs.map((d) => [d.month, d]));
}
