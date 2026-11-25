import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { rememberDevice, resolveDeviceId } from "@/lib/deviceId";
import { readJson } from "@/lib/http";
import { firstExceeded, getClientIp, hashIp, MINUTE, tooMany } from "@/lib/rateLimit";
import { isShopActive } from "@/lib/shop";
import { bumpPeriods, bumpTotals } from "@/lib/totals";
import { isOwnerOfShop } from "@/lib/viewer";
import DirectTap from "@/models/DirectTap";
import Shop from "@/models/Shop";

const DAY_MS = 864e5;

/**
 * POST { slug, deviceId? }: a customer tapped "Review on Google" on the first
 * screen. Counted once per device per shop per day; owners are ignored.
 */
export async function POST(req) {
  const body = await readJson(req);
  if (typeof body.slug !== "string" || !body.slug) return Response.json({ ok: false }, { status: 400 });

  const ipHash = hashIp(getClientIp(req));
  const blocked = await firstExceeded([[`direct:net:${ipHash}`, { limit: 60, windowMs: 10 * MINUTE }]]);
  if (blocked) return tooMany(blocked.retryAfter);

  await connectDB();
  const shop = await Shop.findOne({ slug: body.slug.toLowerCase() }).select("_id status trialEndsAt paidUntil").lean();
  if (!shop || !isShopActive(shop)) return Response.json({ ok: false }, { status: 404 });
  if (await isOwnerOfShop(shop._id)) return Response.json({ ok: true, ignored: "own_shop" });

  const jar = await cookies();
  const deviceId = resolveDeviceId(jar, body.deviceId);
  rememberDevice(jar, deviceId);

  const already = await DirectTap.exists({ shopId: shop._id, deviceId, createdAt: { $gte: new Date(Date.now() - DAY_MS) } });
  if (already) return Response.json({ ok: true, counted: false });

  const now = new Date();
  await DirectTap.create({ shopId: shop._id, deviceId, ipHash, createdAt: now });
  await bumpTotals(shop._id, { direct: 1 });
  await bumpPeriods(shop._id, now, { direct: 1 });
  return Response.json({ ok: true, counted: true });
}
