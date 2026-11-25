import { connectDB } from "@/lib/db";
import { bad, readJson } from "@/lib/http";
import { getClientIp, hashIp, MINUTE, rateLimit, tooMany } from "@/lib/rateLimit";
import { isShopActive } from "@/lib/shop";
import { bumpPeriods, bumpTotals } from "@/lib/totals";
import Scan from "@/models/Scan";
import Shop from "@/models/Shop";
import { isOwnerOfShop } from "@/lib/viewer";

// One call per rating-page visit. It does two jobs at once:
//  1. counts the scan (only when `count` is true: the first open in this
//     browser session, so reloads are not counted twice), and
//  2. tells the page whether the viewer is this shop's own logged-in owner.
export async function POST(req) {
  const rl = await rateLimit(`scan:${hashIp(getClientIp(req))}`, { limit: 60, windowMs: 10 * MINUTE });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { slug, source, count = true } = await readJson(req);
  if (typeof slug !== "string" || !slug) return bad("slug is required");

  await connectDB();
  const shop = await Shop.findOne({ slug: slug.toLowerCase() }).select("_id status trialEndsAt paidUntil").lean();
  if (!shop) return bad("Shop not found", 404);
  if (!isShopActive(shop)) return Response.json({ ok: false, paused: true });

  // The owner opening their own rating page is not a customer scan.
  if (await isOwnerOfShop(shop._id)) return Response.json({ ok: true, ownShop: true });

  if (count) {
    await Scan.create({ shopId: shop._id, source: source === "nfc" ? "nfc" : "qr" });
    await bumpTotals(shop._id, { scans: 1 });
    await bumpPeriods(shop._id, new Date(), { scans: 1 });
  }
  return Response.json({ ok: true, ownShop: false });
}
