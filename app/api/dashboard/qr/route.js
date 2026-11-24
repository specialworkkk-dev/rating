import { posterResponse } from "@/lib/poster";
import { requireApiRole } from "@/lib/session";
import { siteUrl } from "@/lib/site";
import Shop from "@/models/Shop";

export async function GET(req) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const shop = await Shop.findById(user.shopId).lean();
  if (!shop) return Response.json({ error: "Shop not found" }, { status: 404 });
  return posterResponse(req, shop, `${await siteUrl()}/r/${shop.slug}`);
}
