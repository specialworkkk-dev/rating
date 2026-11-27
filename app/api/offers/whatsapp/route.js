import { connectDB } from "@/lib/db";
import { bad, readJson } from "@/lib/http";
import { consentText, offersLive } from "@/lib/offers";
import { cleanPhone, isIndianMobile } from "@/lib/phone";
import { getClientIp, hashIp, MINUTE, rateLimit, tooMany } from "@/lib/rateLimit";
import Shop from "@/models/Shop";
import WhatsAppOptIn from "@/models/WhatsAppOptIn";

/** A customer asks to get a shop's offers on WhatsApp (sent by the shop itself). */
export async function POST(req) {
  const rl = await rateLimit(`waopt:${hashIp(getClientIp(req))}`, { limit: 10, windowMs: 10 * MINUTE });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const { slug, phone, name, consent } = await readJson(req);
  if (consent !== true) return bad("Please tick the box to agree");
  const p = cleanPhone(phone);
  if (p.error || !p.value) return bad(p.error || "Enter your mobile number");
  if (!isIndianMobile(p.value)) return bad("Enter a 10-digit Indian mobile number that has WhatsApp");
  if (typeof slug !== "string" || !slug) return bad("Shop not found", 404);
  await connectDB();
  const shop = await Shop.findOne({ slug: slug.toLowerCase() }).select("_id name status trialEndsAt paidUntil offersEnabled").lean();
  if (!shop) return bad("Shop not found", 404);
  if (!offersLive(shop)) return bad("This shop isn’t sending offers right now", 403);
  await WhatsAppOptIn.updateOne(
    { shopId: shop._id, phone: p.value },
    {
      $set: { name: typeof name === "string" ? name.trim().slice(0, 80) : undefined, consentText: consentText(shop.name) },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
  return Response.json({ ok: true });
}
