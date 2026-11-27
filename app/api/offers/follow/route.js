import { connectDB } from "@/lib/db";
import { bad, readJson } from "@/lib/http";
import { offersLive } from "@/lib/offers";
import { getClientIp, hashIp, MINUTE, rateLimit, tooMany } from "@/lib/rateLimit";
import Follower from "@/models/Follower";
import Shop from "@/models/Shop";

// A customer follows / unfollows a shop's offers from their browser.
// Stores only the browser's push address and keys, for that shop.

function validSubscription(sub) {
  const ok =
    sub &&
    typeof sub.endpoint === "string" &&
    sub.endpoint.length <= 1000 &&
    /^https:\/\//.test(sub.endpoint) &&
    typeof sub.keys?.p256dh === "string" &&
    sub.keys.p256dh.length <= 200 &&
    typeof sub.keys?.auth === "string" &&
    sub.keys.auth.length <= 100;
  return ok ? { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } } : null;
}

async function shopFor(slug) {
  if (typeof slug !== "string" || !slug) return null;
  await connectDB();
  return Shop.findOne({ slug: slug.toLowerCase() }).select("_id status trialEndsAt paidUntil offersEnabled").lean();
}

export async function POST(req) {
  const rl = await rateLimit(`follow:${hashIp(getClientIp(req))}`, { limit: 30, windowMs: 10 * MINUTE });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const { slug, subscription, device } = await readJson(req);
  const sub = validSubscription(subscription);
  if (!sub) return bad("Invalid subscription");
  const shop = await shopFor(slug);
  if (!shop) return bad("Shop not found", 404);
  if (!offersLive(shop)) return bad("This shop isn’t sending offers right now", 403);
  await Follower.updateOne(
    { shopId: shop._id, endpoint: sub.endpoint },
    {
      $set: { keys: sub.keys, device: ["Android", "iPhone", "Computer"].includes(device) ? device : "Other" },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
  return Response.json({ ok: true, following: true });
}

export async function DELETE(req) {
  const { slug, endpoint } = await readJson(req);
  if (typeof endpoint !== "string" || !endpoint) return bad("endpoint is required");
  const shop = await shopFor(slug);
  if (!shop) return bad("Shop not found", 404);
  await Follower.deleteOne({ shopId: shop._id, endpoint });
  return Response.json({ ok: true, following: false });
}
