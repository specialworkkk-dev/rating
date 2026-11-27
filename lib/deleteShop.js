// Permanently delete a shop and everything stored for it. Used by the admin's
// "Delete shop" button. Cannot be undone.
import mongoose from "mongoose";
import { clearShopCache } from "@/lib/shopCache";
import DirectTap from "@/models/DirectTap";
import Feedback from "@/models/Feedback";
import Follower from "@/models/Follower";
import Offer from "@/models/Offer";
import { deleteImage } from "@/lib/imageStore";
import OfferUsage from "@/models/OfferUsage";
import WhatsAppOptIn from "@/models/WhatsAppOptIn";
import RateLimit from "@/models/RateLimit";
import Rating from "@/models/Rating";
import Scan from "@/models/Scan";
import Shop from "@/models/Shop";
import ShopDay from "@/models/ShopDay";
import ShopMonth from "@/models/ShopMonth";
import ShopTotals from "@/models/ShopTotals";
import User from "@/models/User";

/** Days after which a closed shop's data must be gone (our Privacy Policy and Terms). */
export const DELETE_WITHIN_DAYS = 90;
/** Show a reminder on the admin list from this many days after a shop stopped. */
export const DELETE_REMINDER_DAYS = 75;

/**
 * When a shop stopped being live: paused by the admin, or its trial / paid
 * period ended. Null while it is live.
 */
export function inactiveSince(shop, now = new Date()) {
  if (shop.status === "paused") return shop.pausedAt || shop.updatedAt || null;
  const end = shop.status === "trial" ? shop.trialEndsAt : shop.paidUntil;
  return end && new Date(end) <= now ? end : null;
}

export async function deleteShopAndData(shopId) {
  const sid = new mongoose.Types.ObjectId(String(shopId));
  const shop = await Shop.findById(sid).lean();
  if (!shop) return null;

  // Offer photos on Cloudflare R2 (best effort; the records go below).
  const photos = await Offer.find({ shopId: sid, imageUrl: { $exists: true } }).select("imageUrl").lean();
  for (const o of photos) await deleteImage(o.imageUrl);

  // Stop new ratings first, so nothing is added while we delete.
  await Shop.updateOne({ _id: sid }, { $set: { status: "paused", pausedAt: new Date() } });
  clearShopCache(shop.slug);

  const id = String(sid);
  const [ratings, scans, direct, feedback, days, months] = await Promise.all([
    Rating.deleteMany({ shopId: sid }),
    Scan.deleteMany({ shopId: sid }),
    DirectTap.deleteMany({ shopId: sid }),
    Feedback.deleteMany({ shopId: sid }),
    ShopDay.deleteMany({ shopId: sid }),
    ShopMonth.deleteMany({ shopId: sid }),
    ShopTotals.deleteOne({ _id: sid }),
    // Offers (premium): followers, sent offers, usage, WhatsApp list.
    Follower.deleteMany({ shopId: sid }),
    Offer.deleteMany({ shopId: sid }),
    OfferUsage.deleteMany({ shopId: sid }),
    WhatsAppOptIn.deleteMany({ shopId: sid }),
    // Short-lived anti-spam counters for this shop (they expire anyway).
    RateLimit.deleteMany({ _id: { $regex: `^rating:(dev|shopnet):${id}:` } }),
  ]);
  // The owner's login, only if it belongs to this shop and is an owner account.
  const owner = shop.ownerId
    ? await User.deleteOne({ _id: shop.ownerId, role: "owner", shopId: sid })
    : { deletedCount: 0 };
  await Shop.deleteOne({ _id: sid });
  // The rating page and posters now show "not found".
  clearShopCache(shop.slug);

  return {
    name: shop.name,
    slug: shop.slug,
    deleted: {
      ratings: ratings.deletedCount,
      scans: scans.deletedCount,
      googleTaps: direct.deletedCount,
      feedback: feedback.deletedCount,
      dailyCounts: days.deletedCount,
      monthlyCounts: months.deletedCount,
      ownerLogin: owner.deletedCount,
    },
  };
}
