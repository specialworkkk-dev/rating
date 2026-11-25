import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { rememberDevice, resolveDeviceId } from "@/lib/deviceId";
import { bad, readJson } from "@/lib/http";
import { firstExceeded, getClientIp, hashIp, HOUR, MINUTE, tooMany } from "@/lib/rateLimit";
import { googleReviewUrl, HAPPY_MIN_STARS, isShopActive } from "@/lib/shop";
import { bumpPeriods, bumpTotals, moodOf } from "@/lib/totals";
import Rating from "@/models/Rating";
import Shop from "@/models/Shop";

/**
 * One rating per device per shop. Rating again updates that same rating
 * (like editing a Google review) instead of adding a second one.
 */
async function upsertRating({ shop, deviceId, stars, source, ipHash, userAgent }) {
  const now = new Date();
  const run = () =>
    Rating.findOneAndUpdate(
      { shopId: shop._id, deviceId },
      {
        $set: { stars, ipHash, userAgent, updatedAt: now },
        $setOnInsert: { source, createdAt: now, clickedGoogle: false },
      },
      { upsert: true, returnDocument: "before", includeResultMetadata: true, lean: true }
    );

  let res;
  try {
    res = await run();
  } catch (err) {
    if (err?.code !== 11000) throw err;
    res = await run(); // two taps at the same instant: the retry becomes an update
  }

  const before = res.value;
  const ratingId = before ? before._id : res.lastErrorObject?.upserted;
  return {
    ratingId: String(ratingId),
    previousStars: before ? before.stars : null,
    createdAt: before ? before.createdAt : now,
  };
}

export async function POST(req) {
  const body = await readJson(req);
  const n = Number(body.stars);
  if (typeof body.slug !== "string" || !body.slug) return bad("slug is required");
  if (!Number.isInteger(n) || n < 1 || n > 5) return bad("stars must be 1–5");

  await connectDB();
  const shop = await Shop.findOne({ slug: body.slug.toLowerCase() }).lean();
  if (!shop) return bad("Shop not found", 404);
  if (!isShopActive(shop)) return bad("This shop's rating page is paused", 403);

  const jar = await cookies();
  const deviceId = resolveDeviceId(jar, body.deviceId);
  const ipHash = hashIp(getClientIp(req));

  // Limits are generous per network because a whole café can share one WiFi.
  const blocked = await firstExceeded([
    [`rating:dev:${shop._id}:${deviceId}`, { limit: 10, windowMs: 10 * MINUTE }],
    [`rating:shopnet:${shop._id}:${ipHash}`, { limit: 40, windowMs: HOUR }],
    [`rating:net:${ipHash}`, { limit: 60, windowMs: 10 * MINUTE }],
  ]);
  if (blocked) return tooMany(blocked.retryAfter);

  const { ratingId, previousStars, createdAt } = await upsertRating({
    shop,
    deviceId,
    stars: n,
    source: body.source === "nfc" ? "nfc" : "qr",
    ipHash,
    userAgent: (req.headers.get("user-agent") || "").slice(0, 300),
  });
  rememberDevice(jar, deviceId);

  // Keep the shop's all-time totals in step: a new rating adds one; a changed
  // rating moves one count from the old star level to the new one.
  if (previousStars === null) {
    await bumpTotals(shop._id, { ratings: 1, [`stars.${n}`]: 1 });
    await bumpPeriods(shop._id, createdAt, { [moodOf(n)]: 1, stars: n });
  } else if (previousStars !== n) {
    await bumpTotals(shop._id, { [`stars.${previousStars}`]: -1, [`stars.${n}`]: 1 });
    // The rating stays in the day/month it was first given; its stars (and
    // maybe its mood) change there.
    const inc = { stars: n - previousStars };
    if (moodOf(previousStars) !== moodOf(n)) Object.assign(inc, { [moodOf(previousStars)]: -1, [moodOf(n)]: 1 });
    await bumpPeriods(shop._id, createdAt, inc);
  }

  return Response.json({
    ratingId,
    deviceId,
    updated: previousStars !== null,
    previousStars,
    next: n >= HAPPY_MIN_STARS ? "google" : "feedback",
    // Always returned, including for unhappy customers: no review gating.
    googleReviewUrl: googleReviewUrl(shop.googlePlaceId),
  });
}
