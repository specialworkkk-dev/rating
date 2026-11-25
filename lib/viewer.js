import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

/**
 * True when this request comes from a phone logged in as the owner of the
 * given shop. Owners must not rate (or review on Google) their own shop:
 * Google removes reviews written by the business itself.
 */
export async function isOwnerOfShop(shopId) {
  const session = await auth();
  if (session?.user?.role !== "owner" || !session.user.id) return false;
  await connectDB();
  const user = await User.findById(session.user.id).select("shopId").lean();
  return Boolean(user?.shopId && String(user.shopId) === String(shopId));
}
