import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { bad, readJson } from "@/lib/http";
import { getClientIp, rateLimit, tooMany } from "@/lib/rateLimit";
import { googleReviewUrl, HAPPY_MIN_STARS, isShopActive } from "@/lib/shop";
import Rating from "@/models/Rating";
import Shop from "@/models/Shop";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req) {
  const rl = rateLimit(`rating:${getClientIp(req)}`, { limit: 20, windowMs: 10 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { slug, stars, source } = await readJson(req);
  const n = Number(stars);
  if (typeof slug !== "string" || !slug) return bad("slug is required");
  if (!Number.isInteger(n) || n < 1 || n > 5) return bad("stars must be 1–5");

  await connectDB();
  const shop = await Shop.findOne({ slug: slug.toLowerCase() }).lean();
  if (!shop) return bad("Shop not found", 404);
  if (!isShopActive(shop)) return bad("This shop's rating page is paused", 403);

  // One rating per device per shop per day: a repeat tap within 24h updates
  // the earlier rating instead of adding another one.
  const jar = await cookies();
  const cookieName = `rb_r_${shop._id}`;
  const prevId = jar.get(cookieName)?.value;

  let rating = null;
  if (prevId && mongoose.isValidObjectId(prevId)) {
    rating = await Rating.findOneAndUpdate(
      { _id: prevId, shopId: shop._id, createdAt: { $gt: new Date(Date.now() - DAY_MS) } },
      { $set: { stars: n } },
      { returnDocument: "after" }
    );
  }
  if (!rating) {
    rating = await Rating.create({
      shopId: shop._id,
      stars: n,
      source: source === "nfc" ? "nfc" : "qr",
      userAgent: (req.headers.get("user-agent") || "").slice(0, 300),
    });
    jar.set(cookieName, String(rating._id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: DAY_MS / 1000,
      path: "/",
    });
  }

  return Response.json({
    ratingId: String(rating._id),
    next: n >= HAPPY_MIN_STARS ? "google" : "feedback",
    // Always returned, including for unhappy customers: no review gating.
    googleReviewUrl: googleReviewUrl(shop.googlePlaceId),
  });
}
