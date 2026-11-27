import { bad, readJson } from "@/lib/http";
import { cleanPhone } from "@/lib/phone";
import { requireApiRole } from "@/lib/session";
import { clearShopCache } from "@/lib/shopCache";
import Shop from "@/models/Shop";

/** The owner sets the shop phone shown on offer pages ("📞 Call shop"). Empty removes it. */
export async function PATCH(req) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const { phone } = await readJson(req);
  const r = cleanPhone(phone);
  if (r.error) return bad(r.error);
  const shop = await Shop.findByIdAndUpdate(user.shopId, { $set: { publicPhone: r.value } }, { new: true }).select("slug publicPhone").lean();
  clearShopCache(shop.slug);
  return Response.json({ ok: true, phone: shop.publicPhone || "" });
}
