import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { bad } from "@/lib/http";
import { getClientIp, rateLimit, tooMany } from "@/lib/rateLimit";
import Rating from "@/models/Rating";

export async function POST(req, { params }) {
  const rl = rateLimit(`gclick:${getClientIp(req)}`, { limit: 30, windowMs: 10 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid rating id");

  await connectDB();
  const res = await Rating.updateOne({ _id: id }, { $set: { clickedGoogle: true } });
  if (res.matchedCount === 0) return bad("Rating not found", 404);
  return Response.json({ ok: true });
}
