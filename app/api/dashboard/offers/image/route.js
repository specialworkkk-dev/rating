import { randomBytes } from "node:crypto";
import { bad } from "@/lib/http";
import { deleteImage, imageStore, isShopOfferImage, putImage } from "@/lib/imageStore";
import { readJson } from "@/lib/http";
import Offer from "@/models/Offer";
import { offersLive } from "@/lib/offers";
import { HOUR, rateLimit, tooMany } from "@/lib/rateLimit";
import { requireApiRole } from "@/lib/session";
import Shop from "@/models/Shop";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 1_500_000; // the browser shrinks photos before uploading

/** The owner uploads a photo for an offer. Returns { url }. */
export async function POST(req) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  if (!imageStore()) return bad("Photo uploads aren’t set up yet. You can still send offers without a photo.", 503);
  const shop = await Shop.findById(user.shopId).select("_id status trialEndsAt paidUntil offersEnabled").lean();
  if (!offersLive(shop)) return bad("Offers is not switched on for your shop", 403);
  const rl = await rateLimit(`offerimg:${shop._id}`, { limit: 30, windowMs: HOUR });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return bad("Choose a photo");
  const ext = TYPES[file.type];
  if (!ext) return bad("Use a JPG, PNG or WebP photo");
  if (file.size > MAX_BYTES) return bad("That photo is too big. Try a smaller one.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `offers/${shop._id}/${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  try {
    const url = await putImage(key, bytes, file.type);
    return Response.json({ url });
  } catch (err) {
    console.error("[offers] photo upload failed:", err?.message);
    return bad("Couldn’t upload the photo. Please try again.", 502);
  }
}

/**
 * The owner removes a photo before sending (or picks another): delete it from
 * storage at once. Photos of sent offers are kept until the offer is deleted.
 */
export async function DELETE(req) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const { url } = await readJson(req);
  if (!isShopOfferImage(url, user.shopId)) return bad("Not one of your photos");
  if (await Offer.exists({ shopId: user.shopId, imageUrl: url })) return Response.json({ ok: true, kept: "used by a sent offer" });
  await deleteImage(url);
  return Response.json({ ok: true });
}
