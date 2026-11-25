import mongoose from "mongoose";
import { bad, readJson } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import Feedback from "@/models/Feedback";
import { bumpMonth, bumpTotals, istMonthKey, moodOf } from "@/lib/totals";
import Rating from "@/models/Rating";

const HOUR_MS = 60 * 60 * 1000;

/** Remove the ratings in one flagged burst (one network, one hour) and their feedback. */
export async function DELETE(req, { params }) {
  const { error } = await requireApiRole("admin");
  if (error) return error;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid shop id");
  const { ipHash, hour } = await readJson(req);
  const start = new Date(hour);
  if (typeof ipHash !== "string" || !ipHash || Number.isNaN(start.getTime())) {
    return bad("ipHash and hour are required");
  }

  const query = { shopId: id, ipHash, createdAt: { $gte: start, $lt: new Date(start.getTime() + HOUR_MS) } };
  const removed = await Rating.find(query).select("_id stars clickedGoogle createdAt").lean();
  const ids = removed.map((r) => r._id);
  const [ratings, feedback] = await Promise.all([
    Rating.deleteMany({ _id: { $in: ids } }),
    Feedback.deleteMany({ ratingId: { $in: ids } }),
  ]);
  // Take the removed ratings back out of the shop's all-time totals.
  const inc = { ratings: -ratings.deletedCount, google: -removed.filter((r) => r.clickedGoogle).length };
  for (const r of removed) inc[`stars.${r.stars}`] = (inc[`stars.${r.stars}`] || 0) - 1;
  await bumpTotals(id, inc);
  const byMonth = {};
  for (const r of removed) {
    const m = (byMonth[istMonthKey(r.createdAt)] ??= { date: r.createdAt, inc: {} });
    m.inc[moodOf(r.stars)] = (m.inc[moodOf(r.stars)] || 0) - 1;
    if (r.clickedGoogle) m.inc.google = (m.inc.google || 0) - 1;
  }
  for (const { date, inc: monthInc } of Object.values(byMonth)) await bumpMonth(id, date, monthInc);

  return Response.json({ removedRatings: ratings.deletedCount, removedFeedback: feedback.deletedCount });
}
