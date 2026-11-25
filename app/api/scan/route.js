import { connectDB } from "@/lib/db";
import { bad, readJson } from "@/lib/http";
import { getClientIp, hashIp, MINUTE, rateLimit, tooMany } from "@/lib/rateLimit";
import { isShopActive } from "@/lib/shop";
import { bumpPeriods, bumpTotals } from "@/lib/totals";
import Scan from "@/models/Scan";
import Shop from "@/models/Shop";
import { isOwnerOfShop } from "@/lib/viewer";

export async function POST(req) {
  const rl = await rateLimit(`scan:${hashIp(getClientIp(req))}`, { limit: 60, windowMs: 10 * MINUTE });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { slug, source } = await readJson(req);
  if (typeof slug !== "string" || !slug) return bad("slug is required");

  await connectDB();
  const shop = await Shop.findOne({ slug: slug.toLowerCase() }).lean();
  if (!shop) return bad("Shop not found", 404);
  if (!isShopActive(shop)) return Response.json({ ok: false, paused: true });

  // The owner opening their own rating page is not a customer scan.
  if (await isOwnerOfShop(shop._id)) return Response.json({ ok: true, ignored: "own_shop" });

  await Scan.create({ shopId: shop._id, source: source === "nfc" ? "nfc" : "qr" });
  await bumpTotals(shop._id, { scans: 1 });
  await bumpPeriods(shop._id, new Date(), { scans: 1 });
  return Response.json({ ok: true });
}
