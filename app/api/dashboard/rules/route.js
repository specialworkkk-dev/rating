import { requireApiRole } from "@/lib/session";
import Shop from "@/models/Shop";

/** The owner agrees to the fair-review rules. */
export async function POST() {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  await Shop.updateOne(
    { _id: user.shopId, rulesAcceptedAt: { $exists: false } },
    { $set: { rulesAcceptedAt: new Date(), rulesAcceptedVia: "owner" } }
  );
  return Response.json({ ok: true });
}
