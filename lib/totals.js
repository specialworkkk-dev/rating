import mongoose from "mongoose";
import Rating from "../models/Rating.js";
import Scan from "../models/Scan.js";
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
