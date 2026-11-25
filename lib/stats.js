import mongoose from "mongoose";
import Feedback from "@/models/Feedback";
import Rating from "@/models/Rating";
import Scan from "@/models/Scan";
import { getDays, getMonths, getTotals } from "@/lib/totals";

const DAY_MS = 24 * 60 * 60 * 1000;

/** "7" | "30" | "all" → a start date (or null for all time). */
export function sinceFor(range) {
  const days = { 7: 7, 30: 30 }[range];
  return days ? new Date(Date.now() - days * DAY_MS) : null;
}

export function normalizeRange(range) {
  return ["7", "30", "all"].includes(range) ? range : "30";
}

export async function getShopStats(shopId, since) {
  const sid = new mongoose.Types.ObjectId(String(shopId));
  // All time: read the running totals (one small document) instead of
  // scanning every rating the shop has ever received.
  if (!since) {
    const [t, unread] = await Promise.all([getTotals(sid), Feedback.countDocuments({ shopId: sid, isRead: false })]);
    const breakdown = { 1: t.stars[1], 2: t.stars[2], 3: t.stars[3], 4: t.stars[4], 5: t.stars[5] };
    const sum = Object.entries(breakdown).reduce((acc, [s, n]) => acc + Number(s) * n, 0);
    return {
      scans: t.scans,
      ratings: t.ratings,
      average: t.ratings ? Math.round((sum / t.ratings) * 10) / 10 : null,
      breakdown,
      googleClicks: t.google,
      unhappy: breakdown[1] + breakdown[2] + breakdown[3],
      unreadFeedback: unread,
    };
  }
  const when = since ? { createdAt: { $gte: since } } : {};

  const [scans, byStars, unread] = await Promise.all([
    Scan.countDocuments({ shopId: sid, ...when }),
    Rating.aggregate([
      { $match: { shopId: sid, ...when } },
      // Only fields in the covering index, so MongoDB reads the index alone.
      { $project: { _id: 0, stars: 1, clickedGoogle: 1 } },
      {
        $group: {
          _id: "$stars",
          count: { $sum: 1 },
          google: { $sum: { $cond: ["$clickedGoogle", 1, 0] } },
        },
      },
    ]),
    Feedback.countDocuments({ shopId: sid, isRead: false }),
  ]);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratings = 0;
  let sum = 0;
  let googleClicks = 0;
  for (const row of byStars) {
    breakdown[row._id] = row.count;
    ratings += row.count;
    sum += row._id * row.count;
    googleClicks += row.google;
  }

  return {
    scans,
    ratings,
    average: ratings ? Math.round((sum / ratings) * 10) / 10 : null,
    breakdown,
    googleClicks,
    unhappy: breakdown[1] + breakdown[2] + breakdown[3],
    unreadFeedback: unread,
  };
}

/** 30-day activity for every shop, keyed by shop id (admin overview). */
export async function getActivityByShop(days = 30) {
  const since = new Date(Date.now() - days * DAY_MS);
  const [scans, ratings, unread] = await Promise.all([
    Scan.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$shopId", n: { $sum: 1 } } },
    ]),
    Rating.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: "$shopId",
          n: { $sum: 1 },
          google: { $sum: { $cond: ["$clickedGoogle", 1, 0] } },
        },
      },
    ]),
    Feedback.aggregate([
      { $match: { isRead: false } },
      { $group: { _id: "$shopId", n: { $sum: 1 } } },
    ]),
  ]);

  const out = {};
  const row = (id) => (out[String(id)] ??= { scans: 0, ratings: 0, googleClicks: 0, unread: 0 });
  for (const r of scans) row(r._id).scans = r.n;
  for (const r of ratings) Object.assign(row(r._id), { ratings: r.n, googleClicks: r.google });
  for (const r of unread) row(r._id).unread = r.n;
  return out;
}

// ---------------------------------------------------------------------------
// Suspicious bursts: many ratings for one shop from one network within an hour.
// This can be innocent (shop WiFi), so it is only flagged for the admin to
// judge, never removed automatically.
export const BURST_MIN_RATINGS = 6;

function burstPipeline(match) {
  return [
    { $match: { ipHash: { $type: "string" }, ...match } },
    {
      $group: {
        _id: {
          shopId: "$shopId",
          ipHash: "$ipHash",
          hour: { $dateTrunc: { date: "$createdAt", unit: "hour" } },
        },
        count: { $sum: 1 },
        avgStars: { $avg: "$stars" },
        stars: { $push: "$stars" },
        devices: { $addToSet: "$deviceId" },
        first: { $min: "$createdAt" },
        last: { $max: "$createdAt" },
      },
    },
    { $match: { count: { $gte: BURST_MIN_RATINGS } } },
  ];
}

export async function getSuspiciousBursts(shopId, days = 14) {
  const since = new Date(Date.now() - days * DAY_MS);
  const sid = new mongoose.Types.ObjectId(String(shopId));
  const rows = await Rating.aggregate([
    ...burstPipeline({ shopId: sid, createdAt: { $gte: since } }),
    { $sort: { "_id.hour": -1 } },
    { $limit: 20 },
  ]);
  return rows.map((r) => {
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const s of r.stars) breakdown[s] += 1;
    return {
      ipHash: r._id.ipHash,
      network: r._id.ipHash.slice(0, 6),
      hour: r._id.hour.toISOString(),
      count: r.count,
      devices: r.devices.filter(Boolean).length,
      avgStars: Math.round(r.avgStars * 10) / 10,
      breakdown,
      first: r.first.toISOString(),
      last: r.last.toISOString(),
    };
  });
}

/** Number of suspicious bursts per shop in the last `days` days. */
export async function getBurstCountsByShop(days = 14) {
  const since = new Date(Date.now() - days * DAY_MS);
  const rows = await Rating.aggregate([
    ...burstPipeline({ createdAt: { $gte: since } }),
    { $group: { _id: "$_id.shopId", n: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.n]));
}

// ---------------------------------------------------------------------------
// Day-by-day activity for the dashboard charts, in Indian time so a "day"
// matches the shop's calendar.
const TZ = "Asia/Kolkata";

function istDateKey(d) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** One row per day for the last `days` days (oldest first), zero-filled. */
export async function getDailySeries(shopId, days = 30) {
  const keys = dayKeysBetween(addDaysKey(istDateKey(new Date()), -(days - 1)), istDateKey(new Date()));
  const byDay = await getDays(shopId, keys[0], keys.at(-1));
  return keys.map((key) => {
    const r = byDay[key] || { happy: 0, unhappy: 0, google: 0, scans: 0 };
    return { date: key, happy: r.happy, unhappy: r.unhappy, ratings: r.happy + r.unhappy, google: r.google, scans: r.scans };
  });
}

// Calendar keys ("YYYY-MM-DD") are walked with UTC dates so there are no
// time-zone surprises.
const keyToUTC = (k) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
const utcToKey = (t) => new Date(t).toISOString().slice(0, 10);
export const addDaysKey = (k, n) => utcToKey(keyToUTC(k) + n * DAY_MS);
export function dayKeysBetween(from, to) {
  const out = [];
  for (let t = keyToUTC(from); t <= keyToUTC(to); t += DAY_MS) out.push(utcToKey(t));
  return out;
}
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const isRealDay = (k) => DAY_KEY.test(k) && utcToKey(keyToUTC(k)) === k;

export const TABLE_PRESETS = { "1m": 30, "3m": 90, "1y": 365 };
export const MAX_TABLE_DAYS = 3 * 366;

/**
 * Figures table: a period (preset or custom from/to), grouped by day or
 * month, empty rows hidden unless asked, totals for the whole period, paged.
 * Returns { error } for an invalid custom range.
 */
export async function getActivityTable(shopId, { period = "1m", from, to, group = "day", empty = false, page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const today = istDateKey(new Date());
  let start;
  let end;
  if (period === "custom") {
    if (!isRealDay(from || "") || !isRealDay(to || "")) return { error: "Choose a valid From and To date" };
    if (from > to) return { error: "From date must be on or before To date" };
    if (to > today) return { error: "To date can’t be in the future" };
    if (dayKeysBetween(from, to).length > MAX_TABLE_DAYS) return { error: "Choose a range of up to 3 years" };
    [start, end] = [from, to];
  } else {
    const days = TABLE_PRESETS[period] || TABLE_PRESETS["1m"];
    period = TABLE_PRESETS[period] ? period : "1m";
    [start, end] = [addDaysKey(today, -(days - 1)), today];
  }

  const byDay = await getDays(shopId, start, end);
  const dayKeys = dayKeysBetween(start, end);
  let rows = dayKeys.map((key) => {
    const r = byDay[key] || {};
    return { key, scans: r.scans || 0, happy: r.happy || 0, unhappy: r.unhappy || 0, google: r.google || 0 };
  });
  if (group === "month") {
    const months = new Map();
    for (const r of rows) {
      const m = months.get(r.key.slice(0, 7)) || { key: r.key.slice(0, 7), scans: 0, happy: 0, unhappy: 0, google: 0 };
      m.scans += r.scans;
      m.happy += r.happy;
      m.unhappy += r.unhappy;
      m.google += r.google;
      months.set(m.key, m);
    }
    rows = [...months.values()];
  }

  const totals = rows.reduce(
    (t, r) => ({ scans: t.scans + r.scans, happy: t.happy + r.happy, unhappy: t.unhappy + r.unhappy, google: t.google + r.google }),
    { scans: 0, happy: 0, unhappy: 0, google: 0 }
  );
  const allRows = rows.length;
  if (!empty) rows = rows.filter((r) => r.scans || r.happy || r.unhappy || r.google);
  rows.reverse(); // newest first

  const size = pageSizeFrom(pageSize);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return {
    period,
    from: start,
    to: end,
    days: dayKeys.length,
    group: group === "month" ? "month" : "day",
    rows: rows.slice((current - 1) * size, current * size),
    total: rows.length,
    hiddenEmpty: empty ? 0 : allRows - rows.length,
    page: current,
    pages,
    pageSize: size,
    totals,
  };
}

/** Whether a shop has ever been rated (finds one rating instead of counting all). */
export async function hasAnyRating(shopId) {
  return Boolean(await Rating.exists({ shopId }));
}

// ---------------------------------------------------------------------------
// Feedback inbox with filters and pagination.
export const PAGE_SIZES = [5, 10, 15, 25];
export const DEFAULT_PAGE_SIZE = 10;
export const pageSizeFrom = (v) => (PAGE_SIZES.includes(Number(v)) ? Number(v) : DEFAULT_PAGE_SIZE);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * @param {{ status?: "all"|"unread"|"read", stars?: number|null, q?: string, page?: number }} opts
 */
export async function getFeedbackPage(shopId, { status = "all", stars = null, q = "", page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const size = pageSizeFrom(pageSize);
  const sid = new mongoose.Types.ObjectId(String(shopId));
  const query = { shopId: sid };
  if (status === "unread") query.isRead = false;
  if (status === "read") query.isRead = true;
  if ([1, 2, 3].includes(stars)) query.stars = stars;
  const term = q.trim().slice(0, 80);
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    query.$or = [{ message: rx }, { name: rx }, { phone: rx }];
  }

  const total = await Feedback.countDocuments(query);
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const [rows, unread, all] = await Promise.all([
    Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip((current - 1) * size)
      .limit(size)
      .lean(),
    Feedback.countDocuments({ shopId: sid, isRead: false }),
    Feedback.countDocuments({ shopId: sid }),
  ]);

  return {
    items: rows.map((f) => ({
      id: String(f._id),
      stars: f.stars,
      name: f.name || "",
      phone: f.phone || "",
      message: f.message,
      isRead: f.isRead,
      createdAt: f.createdAt.toISOString(),
    })),
    total,
    page: current,
    pages,
    pageSize: size,
    counts: { all, unread },
  };
}

/** One row per month for the last `months` months (oldest first), zero-filled, in IST. */
export async function getMonthlySeries(shopId, months = 12) {
  const [y, m] = istDateKey(new Date()).slice(0, 7).split("-").map(Number);
  const keys = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  // Running monthly counts: 12 small documents, whatever the shop's size.
  const byMonth = await getMonths(shopId, keys);
  return keys.map((key) => {
    const r = byMonth[key] || { happy: 0, unhappy: 0, google: 0, scans: 0 };
    return { date: key, happy: r.happy, unhappy: r.unhappy, ratings: r.happy + r.unhappy, google: r.google, scans: r.scans };
  });
}
