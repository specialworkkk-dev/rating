import mongoose from "mongoose";
import { after } from "next/server";
import { notifyBadRating } from "@/lib/alerts";
import { connectDB } from "@/lib/db";
import { bad, clean, readJson } from "@/lib/http";
import { getClientIp, rateLimit, tooMany } from "@/lib/rateLimit";
import { HAPPY_MIN_STARS, isShopActive } from "@/lib/shop";
import Feedback from "@/models/Feedback";
import Rating from "@/models/Rating";
import Shop from "@/models/Shop";

export async function POST(req) {
  const rl = rateLimit(`feedback:${getClientIp(req)}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const body = await readJson(req);
  const message = clean(body.message, 2000);
  const name = clean(body.name, 80);
  const phone = clean(body.phone, 20);

  if (!mongoose.isValidObjectId(body.ratingId)) return bad("Invalid rating id");
  if (message.length < 3) return bad("Please tell us a little about what went wrong");
  if (phone && !/^[+\d][\d\s-]{5,19}$/.test(phone)) return bad("Please enter a valid phone number");

  await connectDB();
  const rating = await Rating.findById(body.ratingId).lean();
  if (!rating) return bad("Rating not found", 404);
  if (rating.stars >= HAPPY_MIN_STARS) return bad("Feedback is only collected for 1–3 star ratings");

  const shop = await Shop.findById(rating.shopId).lean();
  if (!isShopActive(shop)) return bad("This shop's rating page is paused", 403);

  let feedback;
  try {
    feedback = await Feedback.create({
      shopId: shop._id,
      ratingId: rating._id,
      stars: rating.stars,
      name: name || undefined,
      phone: phone || undefined,
      message,
    });
  } catch (err) {
    if (err?.code === 11000) return bad("Feedback was already sent for this rating", 409);
    throw err;
  }

  // Send alerts after the response so the customer isn't kept waiting.
  after(() =>
    notifyBadRating({ shop, feedback }).catch((e) => console.error("[alert] failed", e))
  );

  return Response.json({ ok: true }, { status: 201 });
}
