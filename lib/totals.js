import mongoose from "mongoose";
import Rating from "../models/Rating.js";
import DirectTap from "../models/DirectTap.js";
import Scan from "../models/Scan.js";
import ShopDay from "../models/ShopDay.js";
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

/** IST midnight at the start of a "YYYY-MM-DD" day. */
export const istDayStart = (key) => new Date(`${key}T00:00:00+05:30`);

/**
 * Where the shop's raw records start. Older ones were deleted by the cleanup
 * (their counts live on in ShopTotals.archived and the ShopDay documents).
 */
async function keptFrom(sid) {
  const t = await ShopTotals.findById(sid).select("archivedBefore archived").lean();
  const key = t?.archivedBefore || null;
  return { key, match: key ? { createdAt: { $gte: istDayStart(key) } } : {}, archived: t?.archived };
}

/** Recompute a shop's totals exactly: archived counts + the raw records still kept. */
export async function recomputeTotals(shopId) {
  const sid = new mongoose.Types.ObjectId(String(shopId));
  const kept = await keptFrom(sid);
  const [rows, scans, direct] = await Promise.all([
    Rating.aggregate([
      { $match: { shopId: sid, ...kept.match } },
      { $project: { _id: 0, stars: 1, clickedGoogle: 1 } },
      { $group: { _id: "$stars", n: { $sum: 1 }, google: { $sum: { $cond: ["$clickedGoogle", 1, 0] } } } },
    ]),
    Scan.countDocuments({ shopId: sid, ...kept.match }),
    DirectTap.countDocuments({ shopId: sid, ...kept.match }),
  ]);
  const old = kept.archived || {};
  const stars = {};
  for (const k of [1, 2, 3, 4, 5]) stars[k] = old.stars?.[k] || 0;
  let ratings = old.ratings || 0;
  let google = old.google || 0;
  for (const r of rows) {
    stars[r._id] += r.n;
    ratings += r.n;
    google += r.google;
  }
  const doc = { ratings, stars, google, scans: scans + (old.scans || 0), direct: direct + (old.direct || 0), recomputedAt: new Date() };
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
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** "YYYY-MM-DD" of a date in Indian time. */
export function istDayKey(date) {
  return dayFmt.format(new Date(date));
}

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

// Version of the per-day / per-month documents. v2 added the star sum (for
// averages). When this number goes up, each shop's rollups are rebuilt once
// from the raw data the next time they are read.
// v3 added direct Google taps.
export const ROLLUP_VERSION = 3;

/**
 * Rebuild a shop's per-month counts by adding up its per-day counts. The days
 * are kept forever, while raw records older than a few months are deleted.
 */
export async function recomputeMonths(shopId) {
  const sid = new mongoose.Types.ObjectId(String(shopId));
  const t = await ShopTotals.findById(sid).select("daysReady").lean();
  if (t?.daysReady !== ROLLUP_VERSION) await recomputeDays(sid);
  const months = await ShopDay.aggregate([
    { $match: { shopId: sid } },
    {
      $group: {
        _id: { $substrBytes: ["$day", 0, 7] },
        happy: { $sum: "$happy" },
        unhappy: { $sum: "$unhappy" },
        google: { $sum: "$google" },
        stars: { $sum: "$stars" },
        scans: { $sum: "$scans" },
        direct: { $sum: "$direct" },
      },
    },
  ]);
  const rows = months.map((m) => ({
    _id: `${sid}:${m._id}`,
    shopId: sid,
    month: m._id,
    happy: m.happy || 0,
    unhappy: m.unhappy || 0,
    google: m.google || 0,
    stars: m.stars || 0,
    scans: m.scans || 0,
    direct: m.direct || 0,
  }));
  await ShopMonth.deleteMany({ shopId: sid });
  if (rows.length) await ShopMonth.insertMany(rows, { ordered: false });
  await ShopTotals.updateOne({ _id: sid }, { $set: { monthsReady: ROLLUP_VERSION } });
}

/** The given months' counts for a shop (builds them once if needed). */
export async function getMonths(shopId, months) {
  const sid = new mongoose.Types.ObjectId(String(shopId));
  const t = await ShopTotals.findById(sid).select("monthsReady").lean();
  if (t?.monthsReady !== ROLLUP_VERSION) await recomputeMonths(sid);
  const docs = await ShopMonth.find({ shopId: sid, month: { $in: months } }).lean();
  return Object.fromEntries(docs.map((d) => [d.month, d]));
}

// ---------------------------------------------------------------------------
// Per-day running counts (daily chart and the figures table).

/** Add +/- counts to one shop-day. */
export async function bumpDay(shopId, date, inc) {
  const clean = Object.fromEntries(Object.entries(inc).filter(([, v]) => v));
  if (!Object.keys(clean).length) return;
  const day = istDayKey(date);
  try {
    await ShopDay.updateOne({ _id: `${shopId}:${day}` }, { $inc: clean, $setOnInsert: { shopId, day } }, { upsert: true });
  } catch (err) {
    console.error("[totals] day bump failed", err?.message);
  }
}

/** Update both the day and the month a date falls in. */
export async function bumpPeriods(shopId, date, inc) {
  await Promise.all([bumpDay(shopId, date, inc), bumpMonth(shopId, date, inc)]);
}

/**
 * Rebuild a shop's per-day counts exactly from the raw ratings and scans.
 * Days older than the cleanup cut-off have no raw records left, so those
 * days are kept as they are.
 */
export async function recomputeDays(shopId) {
  const sid = new mongoose.Types.ObjectId(String(shopId));
  await getTotals(sid); // the totals document (and any archive mark) exists first
  const kept = await keptFrom(sid);
  const day = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } };
  const [ratings, scans] = await Promise.all([
    Rating.aggregate([
      { $match: { shopId: sid, ...kept.match } },
      { $project: { _id: 0, createdAt: 1, stars: 1, clickedGoogle: 1 } },
      {
        $group: {
          _id: day,
          happy: { $sum: { $cond: [{ $gte: ["$stars", 4] }, 1, 0] } },
          unhappy: { $sum: { $cond: [{ $lt: ["$stars", 4] }, 1, 0] } },
          google: { $sum: { $cond: ["$clickedGoogle", 1, 0] } },
          stars: { $sum: "$stars" },
        },
      },
    ]),
    Scan.aggregate([
      { $match: { shopId: sid, ...kept.match } },
      { $project: { _id: 0, createdAt: 1 } },
      { $group: { _id: day, n: { $sum: 1 } } },
    ]),
  ]);
  const directs = await DirectTap.aggregate([{ $match: { shopId: sid, ...kept.match } }, { $group: { _id: day, n: { $sum: 1 } } }]);

  const rows = {};
  const row = (d) => (rows[d] ??= { _id: `${sid}:${d}`, shopId: sid, day: d, happy: 0, unhappy: 0, google: 0, stars: 0, scans: 0, direct: 0 });
  for (const r of ratings) Object.assign(row(r._id), { happy: r.happy, unhappy: r.unhappy, google: r.google, stars: r.stars });
  for (const x of scans) row(x._id).scans = x.n;
  for (const t of directs) row(t._id).direct = t.n;

  await ShopDay.deleteMany({ shopId: sid, ...(kept.key ? { day: { $gte: kept.key } } : {}) });
  if (Object.keys(rows).length) await ShopDay.insertMany(Object.values(rows), { ordered: false });
  await ShopTotals.updateOne({ _id: sid }, { $set: { daysReady: ROLLUP_VERSION } });
}

/** Day counts between two "YYYY-MM-DD" keys inclusive (builds them once if needed). */
export async function getDays(shopId, fromKey, toKey) {
  const sid = new mongoose.Types.ObjectId(String(shopId));
  const t = await ShopTotals.findById(sid).select("daysReady").lean();
  if (t?.daysReady !== ROLLUP_VERSION) await recomputeDays(sid);
  const docs = await ShopDay.find({ shopId: sid, day: { $gte: fromKey, $lte: toKey } }).lean();
  return Object.fromEntries(docs.map((d) => [d.day, d]));
}
