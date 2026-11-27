// Offers (premium): shops send short offers to customers who followed them.
// Delivery uses the browsers' free push services (Web Push, signed with our
// VAPID keys). Nothing here is linked to ratings or reviews.
import webpush from "web-push";
import { connectDB } from "@/lib/db";
import { isShopActive } from "@/lib/shop";
import { istMonthKey } from "@/lib/totals";
import Follower from "@/models/Follower";
import Offer from "@/models/Offer";
import OfferUsage from "@/models/OfferUsage";

export const OFFER_MAX_LENGTH = 200;

/** Exactly what a customer agrees to when asking for offers on WhatsApp (stored with their number). */
export const consentText = (shopName) =>
  `Send me offers from ${shopName} on WhatsApp. I can ask them to stop at any time.`;
const SEND_CONCURRENCY = 25;
const PUSH_TTL_SECONDS = 3 * 24 * 60 * 60; // phones that are off get it within 3 days

export const pushConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let vapidSet = false;
function setupVapid() {
  if (vapidSet) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:offers@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  vapidSet = true;
}

/** Offers work for a shop only while it is switched on by the admin and the shop is live (paid/trial). */
export const offersLive = (shop) => Boolean(shop?.offersEnabled) && isShopActive(shop);

export const offersLimit = (shop) => (Number.isFinite(shop?.offersMonthlyLimit) ? shop.offersMonthlyLimit : 8);

/** Offers sent this Indian calendar month (deleting an offer does not lower it). */
export async function offersUsedThisMonth(shopId) {
  await connectDB();
  const doc = await OfferUsage.findById(`${shopId}:${istMonthKey(new Date())}`).lean();
  return doc?.sent || 0;
}

/** Take one slot from this month's allowance, atomically. False when the limit is reached. */
async function takeSlot(shop) {
  const month = istMonthKey(new Date());
  try {
    const doc = await OfferUsage.findOneAndUpdate(
      { _id: `${shop._id}:${month}`, sent: { $lt: offersLimit(shop) } },
      { $inc: { sent: 1 }, $setOnInsert: { shopId: shop._id, month } },
      { upsert: true, new: true }
    );
    return Boolean(doc);
  } catch (err) {
    if (err?.code === 11000) return false; // the month's document exists and is full
    throw err;
  }
}

/** Run `fn` over items with at most `n` running at once. */
async function eachLimited(items, n, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    })
  );
}

/**
 * Send an offer to every follower of the shop. Returns { offer } or { error }.
 * Followers whose browser says "gone" (blocked, cleared, new phone) are deleted.
 */
export async function sendOffer(shop, { text, endsAt }) {
  if (!pushConfigured()) return { error: "Offers aren’t set up on the server yet (VAPID keys missing)." };
  if (!offersLive(shop)) return { error: "Offers is not switched on for your shop." };
  await connectDB();
  if (!(await takeSlot(shop))) return { error: `You’ve used all ${offersLimit(shop)} offers for this month.`, limit: true };
  setupVapid();

  const followers = await Follower.find({ shopId: shop._id }).lean();
  const offer = await Offer.create({ shopId: shop._id, text, endsAt: endsAt || undefined, followers: followers.length });
  const payload = JSON.stringify({
    title: shop.name,
    body: text,
    url: `/r/${shop.slug}/offer/${offer._id}`,
    icon: shop.logoUrl || "/icon.png",
    tag: String(offer._id),
  });

  let sentTo = 0;
  let removed = 0;
  let failed = 0;
  const gone = [];
  await eachLimited(followers, SEND_CONCURRENCY, async (f) => {
    try {
      await webpush.sendNotification({ endpoint: f.endpoint, keys: f.keys }, payload, { TTL: PUSH_TTL_SECONDS, urgency: "normal" });
      sentTo += 1;
    } catch (err) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        gone.push(f._id);
        removed += 1;
      } else {
        failed += 1;
      }
    }
  });
  if (gone.length) await Follower.deleteMany({ _id: { $in: gone } });
  await Offer.updateOne({ _id: offer._id }, { $set: { sentTo, removed, failed } });
  return { offer: { ...offer.toObject(), sentTo, removed, failed } };
}
