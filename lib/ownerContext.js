import { cache } from "react";
import { requirePageRole } from "@/lib/session";
import { pauseReason } from "@/lib/shop";
import Shop from "@/models/Shop";

/**
 * The signed-in owner, their shop and whether it is paused. cache() makes the
 * owner layout (header) and the page share one lookup per request.
 */
export const getOwnerContext = cache(async () => {
  const user = await requirePageRole("owner"); // admins are sent to /admin
  const shop = user.shopId ? await Shop.findById(user.shopId).lean() : null;
  return { user, shop, paused: shop ? pauseReason(shop) : null };
});
