// Deletes raw records (ratings, scans, direct Google taps) older than a few
// months, to keep the database small. Nothing the owner sees changes:
//  - all-time totals, star breakdown and Google counts are running counts;
//  - the daily and monthly charts/tables read the per-day / per-month counts,
//    which are kept forever;
//  - the counts of the deleted records are saved in ShopTotals.archived first,
//    so a full recount (npm run migrate) still gives the same numbers.
// Feedback messages are never touched here (owners manage those themselves).
//
// Relative imports so plain Node scripts can use this file too.
import mongoose from "mongoose";
import DirectTap from "../models/DirectTap.js";
import Rating from "../models/Rating.js";
import Scan from "../models/Scan.js";
import ServiceSetting from "../models/ServiceSetting.js";
import Shop from "../models/Shop.js";
import ShopTotals from "../models/ShopTotals.js";
import { getTotals, istDayKey, istDayStart, recomputeDays, recomputeMonths, ROLLUP_VERSION } from "./totals.js";

export const DEFAULT_KEEP_MONTHS = 3;
// The 7- and 30-day dashboard figures and the 14-day suspicious-ratings check
// read raw records, so at least 2 months are always kept.
export const MIN_KEEP_MONTHS = 2;

/** Months of raw records to keep (env RAW_KEEP_MONTHS, default 3, minimum 2). */
export function keepMonths(value = process.env.RAW_KEEP_MONTHS) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return DEFAULT_KEEP_MONTHS;
  return Math.max(MIN_KEEP_MONTHS, n);
}

/** The IST day `months` months before today ("YYYY-MM-DD"). Records before it are deleted. */
export function cutoffKey(months, now = new Date()) {
  const [y, m, d] = istDayKey(now).split("-").map(Number);
  // Clamp the day so e.g. 31 May − 3 months is 28/29 Feb, not 3 March.
  const lastDay = new Date(Date.UTC(y, m - 1 - months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 - months, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

/** Archive the counts of one shop's old raw records, then delete them. */
export async function cleanupShop(shopId, cutKey) {
  const sid = new mongoose.Types.ObjectId(String(shopId));

  // 1. The per-day / per-month counts must be complete before any raw record
  //    goes, because they can only be rebuilt from raw records.
  await getTotals(sid);
  let t = await ShopTotals.findById(sid).select("daysReady monthsReady archivedBefore").lean();
  if (t.daysReady !== ROLLUP_VERSION) await recomputeDays(sid);
  if (t.monthsReady !== ROLLUP_VERSION) await recomputeMonths(sid);

  const prevKey = t.archivedBefore || null;
  if (prevKey && prevKey >= cutKey) return { shopId: String(sid), skipped: true };

  // 2. Count what is about to be deleted (only what was not archived before).
  const to = istDayStart(cutKey);
  const range = { $lt: to, ...(prevKey ? { $gte: istDayStart(prevKey) } : {}) };
  const [byStars, scans, direct] = await Promise.all([
    Rating.aggregate([
      { $match: { shopId: sid, createdAt: range } },
      { $project: { _id: 0, stars: 1, clickedGoogle: 1 } },
      { $group: { _id: "$stars", n: { $sum: 1 }, google: { $sum: { $cond: ["$clickedGoogle", 1, 0] } } } },
    ]),
    Scan.countDocuments({ shopId: sid, createdAt: range }),
    DirectTap.countDocuments({ shopId: sid, createdAt: range }),
  ]);
  const inc = { "archived.scans": scans, "archived.direct": direct, "archived.ratings": 0, "archived.google": 0 };
  for (const r of byStars) {
    inc[`archived.stars.${r._id}`] = r.n;
    inc["archived.ratings"] += r.n;
    inc["archived.google"] += r.google;
  }

  // 3. Save the counts and move the mark in one step. The filter on the old
  //    mark means two runs at the same time cannot both add the same counts.
  const saved = await ShopTotals.updateOne(
    { _id: sid, archivedBefore: prevKey },
    { $inc: inc, $set: { archivedBefore: cutKey } }
  );
  if (!saved.modifiedCount) return { shopId: String(sid), skipped: true };

  // 4. Delete. If this stops half-way, nothing is counted twice: recounts only
  //    read raw records from the mark onwards, and the next run deletes the rest.
  const [r, s, d] = await Promise.all([
    Rating.deleteMany({ shopId: sid, createdAt: { $lt: to } }),
    Scan.deleteMany({ shopId: sid, createdAt: { $lt: to } }),
    DirectTap.deleteMany({ shopId: sid, createdAt: { $lt: to } }),
  ]);
  return { shopId: String(sid), ratings: r.deletedCount, scans: s.deletedCount, direct: d.deletedCount };
}

/**
 * Clean every shop, stopping early when the time budget runs out (the rest
 * are done on the next daily run).
 */
export async function cleanupAll({ months = keepMonths(), budgetMs = 50_000, now = new Date() } = {}) {
  const started = Date.now();
  const cutKey = cutoffKey(months, now);
  // Shops whose mark is furthest behind go first.
  const marks = await ShopTotals.find().select("archivedBefore").lean();
  const markOf = Object.fromEntries(marks.map((m) => [String(m._id), m.archivedBefore || ""]));
  const shops = (await Shop.find().select("_id").lean()).sort(
    (a, b) => (markOf[String(a._id)] || "").localeCompare(markOf[String(b._id)] || "")
  );

  const done = { ratings: 0, scans: 0, direct: 0 };
  let shopsDone = 0;
  for (const shop of shops) {
    if (Date.now() - started > budgetMs) break;
    const res = await cleanupShop(shop._id, cutKey);
    shopsDone += 1;
    if (res.skipped) continue;
    done.ratings += res.ratings;
    done.scans += res.scans;
    done.direct += res.direct;
  }
  const result = { keepMonths: months, deletedBefore: cutKey, shops: shops.length, shopsDone, deleted: done, ms: Date.now() - started };
  // Shown on the admin Services page.
  await ServiceSetting.updateOne(
    { _id: "mongodb" },
    { $set: { lastCleanup: { at: new Date(), deletedBefore: cutKey, keepMonths: months, shops: shops.length, shopsDone, deleted: done } } },
    { upsert: true }
  );
  return result;
}
