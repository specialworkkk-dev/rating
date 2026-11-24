import mongoose from "mongoose";
import { bad, readJson } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import { addMonths, adminShop, parseShopInput } from "@/lib/shopInput";
import Shop from "@/models/Shop";
import User from "@/models/User";

export async function PATCH(req, { params }) {
  const { error } = await requireApiRole("admin");
  if (error) return error;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid shop id");
  const shop = await Shop.findById(id);
  if (!shop) return bad("Shop not found", 404);

  const body = await readJson(req);

  // Shortcut for "customer paid": activate and extend from today or the
  // current paid-until date, whichever is later.
  if (body.action === "extendPaid") {
    const months = Number(body.months) || 1;
    if (!Number.isInteger(months) || months < 1 || months > 24) return bad("months must be 1–24");
    const from = shop.paidUntil && shop.paidUntil > new Date() ? shop.paidUntil : new Date();
    shop.status = "active";
    shop.paidUntil = addMonths(from, months);
  } else {
    const parsed = parseShopInput(body, { partial: true });
    if (parsed.error) return bad(parsed.error);
    shop.set(parsed.data);
  }

  try {
    await shop.save();
  } catch (err) {
    if (err?.code === 11000) return bad("That link name is already taken", 409);
    throw err;
  }

  const owner = shop.ownerId ? await User.findById(shop.ownerId).select("name email").lean() : null;
  return Response.json({ shop: adminShop(shop.toObject(), owner) });
}
