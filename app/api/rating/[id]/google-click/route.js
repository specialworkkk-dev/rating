import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { bad } from "@/lib/http";
import { getClientIp, hashIp, MINUTE, rateLimit, tooMany } from "@/lib/rateLimit";
import { bumpTotals } from "@/lib/totals";
import Rating from "@/models/Rating";

export async function POST(req, { params }) {
  const rl = await rateLimit(`gclick:${hashIp(getClientIp(req))}`, { limit: 60, windowMs: 10 * MINUTE });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid rating id");

  await connectDB();
  // Count a rating's Google tap once, however many times the button is tapped.
  const first = await Rating.findOneAndUpdate(
    { _id: id, clickedGoogle: { $ne: true } },
    { $set: { clickedGoogle: true } },
    { projection: { shopId: 1 }, lean: true }
  );
  if (first) await bumpTotals(first.shopId, { google: 1 });
  else if (!(await Rating.exists({ _id: id }))) return bad("Rating not found", 404);
  return Response.json({ ok: true });
}
