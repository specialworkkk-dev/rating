import { bad, readJson } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import Feedback from "@/models/Feedback";

const PRESETS = { "1m": { months: 1 }, "2m": { months: 2 }, "3m": { months: 3 }, "1y": { months: 12 } };

/** Messages received before this date are "older than" the chosen period. */
function cutoffFor(body) {
  let months;
  if (PRESETS[body.olderThan]) months = PRESETS[body.olderThan].months;
  else if (body.olderThan === "years") {
    const years = Number(body.years);
    if (!Number.isInteger(years) || years < 1 || years > 10) return null;
    months = years * 12;
  } else return null;
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

/**
 * The owner deletes old messages for good.
 * POST { olderThan: "1m" | "3m" | "1y" | "years", years?: 1-10, confirm?: true }
 * Without confirm it only counts (preview); with confirm it deletes from the
 * database. Star ratings are kept, so the dashboard numbers stay accurate.
 */
export async function POST(req) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;

  const body = await readJson(req);
  const cutoff = cutoffFor(body);
  if (!cutoff) return bad("Choose 1 month, 2 months, 3 months, 1 year, or 1–10 years");

  const query = { shopId: user.shopId, createdAt: { $lt: cutoff } };
  if (body.confirm !== true) {
    return Response.json({ count: await Feedback.countDocuments(query), cutoff: cutoff.toISOString() });
  }
  const res = await Feedback.deleteMany(query);
  return Response.json({ deleted: res.deletedCount, cutoff: cutoff.toISOString() });
}
