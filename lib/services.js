// Usage of the outside services, for the admin "Services" page.
// MongoDB numbers are exact (read from the database itself). Vercel numbers
// are estimated from the visits the app already counts.
import mongoose from "mongoose";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { getRawKeepSetting } from "@/lib/dataSettings";
import { planOf, usageLevel } from "@/lib/servicePlans";
import { istDayKey, istMonthKey, recomputeMonths, ROLLUP_VERSION } from "@/lib/totals";
import { addDaysKey } from "@/lib/stats";
import Feedback from "@/models/Feedback";
import ServiceSetting from "@/models/ServiceSetting";
import Shop from "@/models/Shop";
import ShopDay from "@/models/ShopDay";
import ShopMonth from "@/models/ShopMonth";
import ShopTotals from "@/models/ShopTotals";

const TZ = "Asia/Kolkata";
// Besides the counted requests (scan, rating, Google tap, feedback), there
// are reloads, owner dashboards, logins and poster downloads.
const OVERHEAD = 1.25;
const DEFAULT_CALLS_PER_VISIT = 3;
// Measured with 4 lakh test ratings: a rating + a scan ≈ 0.45 KB with indexes.
const DEFAULT_BYTES_PER_VISIT = 450;
/** Remind the admin to download a backup this often. */
export const BACKUP_EVERY_DAYS = 7;

/** The admin's plan, cost and limit for a service (catalog defaults if unset). */
export async function getServiceSetting(id) {
  await connectDB();
  const doc = (await ServiceSetting.findById(id).lean()) || {};
  const plan = planOf(id, doc.plan);
  return {
    plan: plan.id,
    planLabel: plan.label,
    free: plan.free,
    note: plan.note,
    cost: Number.isFinite(doc.cost) ? doc.cost : plan.cost,
    limit: Number.isFinite(doc.limit) ? doc.limit : plan.limit,
    lastCleanup: doc.lastCleanup?.at ? doc.lastCleanup : null,
    lastBackup: doc.lastBackup?.at ? doc.lastBackup : null,
  };
}

const monthStart = (key) => new Date(`${key}-01T00:00:00+05:30`);
function lastMonths(n, now = new Date()) {
  const [y, m] = istMonthKey(now).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    return d.toISOString().slice(0, 7);
  }).reverse();
}
const daysInMonth = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

/** Make sure every shop's monthly counts exist (normally nothing to do). */
async function ensureMonthlyCounts() {
  const [shops, ready] = await Promise.all([
    Shop.find().select("_id").lean(),
    ShopTotals.find({ monthsReady: ROLLUP_VERSION }).select("_id").lean(),
  ]);
  const ok = new Set(ready.map((r) => String(r._id)));
  for (const s of shops) if (!ok.has(String(s._id))) await recomputeMonths(s._id);
}

/** Visits and requests over the last 30 days, all shops together. */
async function recentActivity(now = new Date()) {
  const today = istDayKey(now);
  const from = addDaysKey(today, -29);
  const [[sum] = [], first, feedback] = await Promise.all([
    ShopDay.aggregate([
      { $match: { day: { $gte: from, $lte: today } } },
      {
        $group: {
          _id: null,
          scans: { $sum: "$scans" },
          ratings: { $sum: { $add: ["$happy", "$unhappy"] } },
          google: { $sum: "$google" },
          direct: { $sum: { $ifNull: ["$direct", 0] } },
        },
      },
    ]),
    ShopDay.findOne().sort({ day: 1 }).select("day").lean(),
    Feedback.countDocuments({ createdAt: { $gte: new Date(`${from}T00:00:00+05:30`) } }),
  ]);
  const s = sum || { scans: 0, ratings: 0, google: 0, direct: 0 };
  // A new app has fewer than 30 days of history; average over what exists.
  const sinceFirst = first ? Math.round((new Date(`${today}T00:00:00Z`) - new Date(`${first.day}T00:00:00Z`)) / 864e5) + 1 : 1;
  const days = Math.min(30, Math.max(1, sinceFirst));
  const visits = Math.max(s.scans, s.ratings);
  const calls = (s.scans + s.ratings + s.google + s.direct + feedback) * OVERHEAD;
  return { days, visitsPerDay: visits / days, callsPerDay: calls / days, callsPerVisit: visits >= 50 ? calls / visits : DEFAULT_CALLS_PER_VISIT };
}

export async function getVercelUsage(now = new Date()) {
  await connectDB();
  await ensureMonthlyCounts();
  const [setting, recent] = await Promise.all([getServiceSetting("vercel"), recentActivity(now)]);
  const keys = lastMonths(6, now);
  const [rows, fb, payingShops] = await Promise.all([
    ShopMonth.aggregate([
      { $match: { month: { $in: keys } } },
      {
        $group: {
          _id: "$month",
          scans: { $sum: "$scans" },
          ratings: { $sum: { $add: ["$happy", "$unhappy"] } },
          google: { $sum: "$google" },
          direct: { $sum: { $ifNull: ["$direct", 0] } },
        },
      },
    ]),
    Feedback.aggregate([
      { $match: { createdAt: { $gte: monthStart(keys[0]) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: TZ } }, n: { $sum: 1 } } },
    ]),
    Shop.countDocuments({ status: "active", monthlyPrice: { $gt: 0 } }),
  ]);
  const byMonth = Object.fromEntries(rows.map((r) => [r._id, r]));
  const fbByMonth = Object.fromEntries(fb.map((r) => [r._id, r.n]));
  const months = keys.map((key) => {
    const r = byMonth[key] || { scans: 0, ratings: 0, google: 0, direct: 0 };
    const calls = Math.round((r.scans + r.ratings + r.google + r.direct + (fbByMonth[key] || 0)) * OVERHEAD);
    return { month: key, visits: Math.max(r.scans, r.ratings), calls };
  });

  const current = months.at(-1);
  const thisMonth = keys.at(-1);
  const dayOfMonth = Number(istDayKey(now).slice(8, 10));
  const daysLeft = daysInMonth(thisMonth) - dayOfMonth;
  const projected = Math.round(current.calls + recent.callsPerDay * daysLeft);
  const percent = setting.limit ? (current.calls / setting.limit) * 100 : 0;
  const projectedPercent = setting.limit ? (projected / setting.limit) * 100 : 0;
  return {
    ...setting,
    used: current.calls,
    percent,
    level: usageLevel(Math.max(percent, projectedPercent)),
    projected,
    projectedPercent,
    monthEnd: `${thisMonth}-${String(daysInMonth(thisMonth)).padStart(2, "0")}`,
    callsPerVisit: recent.callsPerVisit,
    visitsPerDay: recent.visitsPerDay,
    capacityPerDay: Math.floor(setting.limit / 30 / recent.callsPerVisit),
    months,
    // The free Hobby plan is for non-commercial use; paying shops make it commercial.
    commercialWarning: setting.plan === "hobby" && payingShops > 0 ? payingShops : 0,
  };
}

const RAW = ["ratings", "scans", "directtaps"];
const GROUPS = [
  { id: "raw", label: "Ratings & visits", hint: "cleaned up after a few months", names: RAW },
  { id: "feedback", label: "Feedback messages", names: ["feedbacks"] },
  { id: "counts", label: "Daily, monthly & all-time counts", hint: "kept forever", names: ["shopdays", "shopmonths", "shoptotals"] },
  { id: "shops", label: "Shops & logins", names: ["shops", "users"] },
];

export async function getMongoUsage(now = new Date()) {
  await connectDB();
  const db = mongoose.connection.db;
  const appName = db.databaseName;
  const [setting, recent] = await Promise.all([getServiceSetting("mongodb"), recentActivity(now)]);

  // Every database on the cluster counts towards the plan's limit.
  let databases;
  try {
    const res = await db.admin().listDatabases();
    databases = res.databases
      .filter((d) => !["admin", "local", "config"].includes(d.name))
      .map((d) => ({ name: d.name, bytes: d.sizeOnDisk || 0 }));
  } catch {
    const s = await db.stats();
    databases = [{ name: appName, bytes: (s.storageSize || 0) + (s.indexSize || 0) }];
  }
  const total = databases.reduce((a, d) => a + d.bytes, 0);
  const app = databases.find((d) => d.name === appName)?.bytes || 0;
  const others = databases.filter((d) => d.name !== appName && d.bytes > 0).sort((a, b) => b.bytes - a.bytes);

  // This app's collections, grouped into plain words.
  const cols = await db.listCollections({}, { nameOnly: true }).toArray();
  const sizes = {};
  const counts = {};
  await Promise.all(
    cols.map(async ({ name }) => {
      try {
        const [s] = await db.collection(name).aggregate([{ $collStats: { storageStats: {} } }]).toArray();
        sizes[name] = (s.storageStats.storageSize || 0) + (s.storageStats.totalIndexSize || 0);
        counts[name] = s.storageStats.count || 0;
      } catch {
        sizes[name] = 0;
      }
    })
  );
  const grouped = new Set(GROUPS.flatMap((g) => g.names));
  const groups = [
    ...GROUPS.map((g) => ({ id: g.id, label: g.label, hint: g.hint, bytes: g.names.reduce((a, n) => a + (sizes[n] || 0), 0) })),
    { id: "other", label: "Other", bytes: Object.entries(sizes).filter(([n]) => !grouped.has(n)).reduce((a, [, b]) => a + b, 0) },
  ];

  // Where this is heading. Raw records older than the cleanup window are
  // deleted, so the app's size levels off instead of growing forever.
  const rawKeep = await getRawKeepSetting();
  const months = rawKeep.months;
  const keepDays = months * 30.4;
  const rawBytes = groups[0].bytes;
  const rawVisits = Math.max(counts.ratings || 0, counts.scans || 0);
  const bytesPerVisit = rawVisits >= 20_000 ? rawBytes / rawVisits : DEFAULT_BYTES_PER_VISIT;
  const fixed = Math.max(0, app - rawBytes);
  const steadyApp = fixed + recent.visitsPerDay * keepDays * bytesPerVisit;
  const limitBytes = setting.limit * 1048576;
  const room = limitBytes - (total - app) - fixed;
  const percent = limitBytes ? (total / limitBytes) * 100 : 0;
  return {
    ...setting,
    used: total,
    percent,
    level: usageLevel(percent),
    app,
    appName,
    others,
    groups,
    keepMonths: months,
    rawKeep,
    visitsPerDay: recent.visitsPerDay,
    steadyApp,
    steadyPercent: limitBytes ? ((total - app + steadyApp) / limitBytes) * 100 : 0,
    capacityPerDay: Math.max(0, Math.floor(room / (keepDays * bytesPerVisit))),
    sampleData: others.filter((d) => d.name.startsWith("sample_")),
  };
}

export const SERVICES_TAG = "services";

// The usage checks are reused for 5 minutes (changing a plan refreshes them).
const cachedUsageAlerts = unstable_cache(() => computeServiceAlerts(), ["service-alerts-v2"], {
  revalidate: 300,
  tags: [SERVICES_TAG],
});

/** Short warnings for the admin home page (empty when all is well). */
export async function getServiceAlerts() {
  const [usage, backup] = await Promise.all([cachedUsageAlerts(), backupAlert()]);
  return backup ? [...usage, backup] : usage;
}

/** Checked fresh every time (one small read), so it clears right after a download. */
async function backupAlert() {
  try {
    await connectDB();
    const doc = await ServiceSetting.findById("mongodb").select("lastBackup").lean();
    const at = doc?.lastBackup?.at ? new Date(doc.lastBackup.at) : null;
    if (at && Date.now() - at < BACKUP_EVERY_DAYS * 864e5) return null;
    return at ? `No backup for ${Math.floor((Date.now() - at) / 864e5)} days` : "No backup downloaded yet";
  } catch {
    return null;
  }
}

async function computeServiceAlerts() {
  try {
    const [v, m] = await Promise.all([getVercelUsage(), getMongoUsage()]);
    const out = [];
    if (m.percent >= 80) out.push(`Database is ${Math.round(m.percent)}% full`);
    if (v.percent >= 80) out.push(`Vercel has used ${Math.round(v.percent)}% of this month’s calls`);
    else if (v.projectedPercent >= 100) out.push(`Vercel calls will pass the plan’s limit this month`);
    if (v.commercialWarning) out.push("Vercel’s free plan is for non-commercial use, and you have paying shops");
    return out;
  } catch (err) {
    console.error("[services] alerts failed", err?.message);
    return [];
  }
}
