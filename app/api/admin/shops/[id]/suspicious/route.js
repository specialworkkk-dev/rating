import mongoose from "mongoose";
import { bad, readJson } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import Feedback from "@/models/Feedback";
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
  const ids = (await Rating.find(query).select("_id").lean()).map((r) => r._id);
  const [ratings, feedback] = await Promise.all([
    Rating.deleteMany({ _id: { $in: ids } }),
    Feedback.deleteMany({ ratingId: { $in: ids } }),
  ]);
  return Response.json({ removedRatings: ratings.deletedCount, removedFeedback: feedback.deletedCount });
}
