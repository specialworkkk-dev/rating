import mongoose from "mongoose";
import { cookies } from "next/headers";
import { after } from "next/server";
import { notifyBadRating } from "@/lib/alerts";
import { connectDB } from "@/lib/db";
import { rememberDevice, resolveDeviceId } from "@/lib/deviceId";
import { bad, clean, readJson } from "@/lib/http";
import { firstExceeded, getClientIp, hashIp, HOUR, tooMany } from "@/lib/rateLimit";
import { HAPPY_MIN_STARS, isShopActive } from "@/lib/shop";
import Feedback from "@/models/Feedback";
import Rating from "@/models/Rating";
import Shop from "@/models/Shop";

const DAY_MS = 24 * HOUR;
const MAX_TOTAL = 4000;

/**
 * Every complaint is kept, so the owner hears about each bad visit. To stop
 * spam, one device gets one feedback entry per shop per day: a second message
 * the same day is appended to that entry (and doesn't trigger a second alert).
 */
export async function POST(req) {
  const body = await readJson(req);
  const message = clean(body.message, 2000);
  const name = clean(body.name, 80);
  const phone = clean(body.phone, 20);

  if (!mongoose.isValidObjectId(body.ratingId)) return bad("Invalid rating id");
  if (message.length < 3) return bad("Please tell us a little about what went wrong");
  if (phone && !/^[+\d][\d\s-]{5,19}$/.test(phone)) return bad("Please enter a valid phone number");

  const jar = await cookies();
  const deviceId = resolveDeviceId(jar, body.deviceId);
  const ipHash = hashIp(getClientIp(req));

  const blocked = await firstExceeded([
    [`feedback:net:${ipHash}`, { limit: 20, windowMs: HOUR }],
    [`feedback:dev:${deviceId}`, { limit: 10, windowMs: HOUR }],
  ]);
  if (blocked) return tooMany(blocked.retryAfter);

  await connectDB();
  const rating = await Rating.findById(body.ratingId).lean();
  if (!rating) return bad("Rating not found", 404);
  // A rating can only get feedback from the device that made it.
  if (rating.deviceId && rating.deviceId !== deviceId) return bad("This rating belongs to another device", 403);
  if (rating.stars >= HAPPY_MIN_STARS) return bad("Feedback is only collected for 1–3 star ratings");

  const shop = await Shop.findById(rating.shopId).lean();
  if (!isShopActive(shop)) return bad("This shop's rating page is paused", 403);
  rememberDevice(jar, deviceId);

  const now = new Date();
  const today = await Feedback.findOne({
    shopId: shop._id,
    deviceId,
    createdAt: { $gte: new Date(now.getTime() - DAY_MS) },
  }).sort({ createdAt: -1 });

  if (today) {
    const combined = `${today.message}\n\n${message}`;
    if (combined.length > MAX_TOTAL) {
      return bad("You’ve already sent a long message today. The owner has it, so please call the shop for anything more.");
    }
    today.message = combined;
    today.stars = rating.stars;
    today.ratingId = rating._id;
    if (name) today.name = name;
    if (phone) today.phone = phone;
    today.isRead = false;
    today.updatedAt = now;
    await today.save();
    return Response.json({ ok: true, appended: true });
  }

  const feedback = await Feedback.create({
    shopId: shop._id,
    ratingId: rating._id,
    deviceId,
    ipHash,
    stars: rating.stars,
    name: name || undefined,
    phone: phone || undefined,
    message,
  });

  // Send alerts after the response so the customer isn't kept waiting.
  after(() =>
    notifyBadRating({ shop, feedback }).catch((e) => console.error("[alert] failed", e))
  );

  return Response.json({ ok: true, appended: false }, { status: 201 });
}
