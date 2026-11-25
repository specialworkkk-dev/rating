import mongoose from "mongoose";
import Feedback from "@/models/Feedback";
import Rating from "@/models/Rating";
import Scan from "@/models/Scan";

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
  const when = since ? { createdAt: { $gte: since } } : {};

  const [scans, byStars, unread] = await Promise.all([
    Scan.countDocuments({ shopId: sid, ...when }),
    Rating.aggregate([
      { $match: { shopId: sid, ...when } },
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
  const sid = new mongoose.Types.ObjectId(String(shopId));
  const since = new Date(Date.now() - days * DAY_MS);
  const day = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } };

  const [ratings, scans] = await Promise.all([
    Rating.aggregate([
      { $match: { shopId: sid, createdAt: { $gte: since } } },
      {
        $group: {
          _id: day,
          happy: { $sum: { $cond: [{ $gte: ["$stars", 4] }, 1, 0] } },
          unhappy: { $sum: { $cond: [{ $lt: ["$stars", 4] }, 1, 0] } },
          google: { $sum: { $cond: ["$clickedGoogle", 1, 0] } },
        },
      },
    ]),
    Scan.aggregate([
      { $match: { shopId: sid, createdAt: { $gte: since } } },
      { $group: { _id: day, n: { $sum: 1 } } },
    ]),
  ]);

  const byDay = Object.fromEntries(ratings.map((r) => [r._id, r]));
  const scansByDay = Object.fromEntries(scans.map((s) => [s._id, s.n]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = istDateKey(new Date(Date.now() - i * DAY_MS));
    const r = byDay[key] || { happy: 0, unhappy: 0, google: 0 };
    out.push({
      date: key,
      happy: r.happy,
      unhappy: r.unhappy,
      ratings: r.happy + r.unhappy,
      google: r.google,
      scans: scansByDay[key] || 0,
    });
  }
  return out;
}

/** Total ratings a shop has ever received (to detect brand-new shops). */
export function countAllRatings(shopId) {
  return Rating.countDocuments({ shopId });
}

// ---------------------------------------------------------------------------
// Feedback inbox with filters and pagination.
export const FEEDBACK_PAGE_SIZE = 10;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * @param {{ status?: "all"|"unread"|"read", stars?: number|null, q?: string, page?: number }} opts
 */
export async function getFeedbackPage(shopId, { status = "all", stars = null, q = "", page = 1 } = {}) {
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
  const pages = Math.max(1, Math.ceil(total / FEEDBACK_PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const [rows, unread, all] = await Promise.all([
    Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip((current - 1) * FEEDBACK_PAGE_SIZE)
      .limit(FEEDBACK_PAGE_SIZE)
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
    pageSize: FEEDBACK_PAGE_SIZE,
    counts: { all, unread },
  };
}
