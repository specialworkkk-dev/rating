import { connectDB } from "@/lib/db";
import { bad, readJson } from "@/lib/http";
import { getClientIp, rateLimit, tooMany } from "@/lib/rateLimit";
import { isShopActive } from "@/lib/shop";
import Scan from "@/models/Scan";
import Shop from "@/models/Shop";

export async function POST(req) {
  const rl = rateLimit(`scan:${getClientIp(req)}`, { limit: 30, windowMs: 10 * 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { slug, source } = await readJson(req);
  if (typeof slug !== "string" || !slug) return bad("slug is required");

  await connectDB();
  const shop = await Shop.findOne({ slug: slug.toLowerCase() }).lean();
  if (!shop) return bad("Shop not found", 404);
  if (!isShopActive(shop)) return Response.json({ ok: false, paused: true });

  await Scan.create({ shopId: shop._id, source: source === "nfc" ? "nfc" : "qr" });
  return Response.json({ ok: true });
}
