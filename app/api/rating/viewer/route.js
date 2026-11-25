import { getPublicShop } from "@/lib/shopCache";
import { isOwnerOfShop } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * GET ?slug=… → { ownShop }. The rating page itself is cached for everyone,
 * so it asks here (with the visitor's cookies) whether the person looking at
 * it is this shop's logged-in owner.
 */
export async function GET(req) {
  const slug = new URL(req.url).searchParams.get("slug") || "";
  const shop = slug ? await getPublicShop(slug) : null;
  const ownShop = shop ? await isOwnerOfShop(shop.id) : false;
  return Response.json({ ownShop }, { headers: { "Cache-Control": "private, no-store" } });
}
