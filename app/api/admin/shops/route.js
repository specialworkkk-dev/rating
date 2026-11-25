import { bad, readJson } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import { clearShopCache } from "@/lib/shopCache";
import { adminShop, parseShopInput } from "@/lib/shopInput";
import Shop from "@/models/Shop";
import User from "@/models/User";

const TRIAL_DAYS = 15;

export async function GET() {
  const { error } = await requireApiRole("admin");
  if (error) return error;

  const shops = await Shop.find().sort({ createdAt: -1 }).lean();
  const owners = await User.find({ _id: { $in: shops.map((s) => s.ownerId).filter(Boolean) } })
    .select("name email")
    .lean();
  const byId = Object.fromEntries(owners.map((o) => [String(o._id), o]));
  return Response.json({ shops: shops.map((s) => adminShop(s, byId[String(s.ownerId)])) });
}

export async function POST(req) {
  const { error } = await requireApiRole("admin");
  if (error) return error;

  const parsed = parseShopInput(await readJson(req));
  if (parsed.error) return bad(parsed.error);
  const data = parsed.data;

  data.status ??= "trial";
  if (data.status === "trial" && !data.trialEndsAt) {
    data.trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  }

  try {
    const shop = await Shop.create(data);
    clearShopCache(shop.slug); // a "not found" for this link may have been cached
    return Response.json({ shop: adminShop(shop.toObject()) }, { status: 201 });
  } catch (err) {
    if (err?.code === 11000) return bad("That link name is already taken", 409);
    throw err;
  }
}
