import { getTermsVersion } from "@/lib/tokenSettings";
import { requireApiRole } from "@/lib/session";
import Shop from "@/models/Shop";

/** The owner agrees to the Terms of Service and the fair-review rules. */
export async function POST() {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const now = new Date();
  await Shop.updateOne(
    { _id: user.shopId, rulesAcceptedAt: { $exists: false } },
    { $set: { rulesAcceptedAt: now, rulesAcceptedVia: "owner" } }
  );
  await Shop.updateOne({ _id: user.shopId }, { $set: { termsVersion: await getTermsVersion(), termsAcceptedAt: now } });
  return Response.json({ ok: true });
}
