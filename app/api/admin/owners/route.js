import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { bad, clean, readJson } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import { isValidEmail } from "@/lib/shopInput";
import Shop from "@/models/Shop";
import User from "@/models/User";

/**
 * Create the owner login for a shop, or update it if the shop already has one
 * (change name / email, or reset the password).
 */
export async function POST(req) {
  const { error } = await requireApiRole("admin");
  if (error) return error;

  const body = await readJson(req);
  const name = clean(body.name, 80);
  const email = clean(body.email, 200).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!mongoose.isValidObjectId(body.shopId)) return bad("Invalid shop id");
  if (!isValidEmail(email)) return bad("Enter a valid email");

  const shop = await Shop.findById(body.shopId);
  if (!shop) return bad("Shop not found", 404);

  let owner = shop.ownerId ? await User.findById(shop.ownerId) : null;
  const creating = !owner;
  if (creating && password.length < 8) return bad("Password must be at least 8 characters");
  if (!creating && password && password.length < 8) {
    return bad("New password must be at least 8 characters");
  }

  const clash = await User.findOne({ email, _id: { $ne: owner?._id } }).lean();
  if (clash) return bad("Another account already uses that email", 409);

  if (creating) owner = new User({ role: "owner", shopId: shop._id });
  owner.name = name;
  owner.email = email;
  if (password) owner.passwordHash = await bcrypt.hash(password, 10);
  await owner.save();

  shop.ownerId = owner._id;
  if (!shop.alertEmail) shop.alertEmail = email;
  await shop.save();

  return Response.json(
    { owner: { id: String(owner._id), name: owner.name, email: owner.email }, created: creating },
    { status: creating ? 201 : 200 }
  );
}
