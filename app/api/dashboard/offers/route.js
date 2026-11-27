import { bad, readJson } from "@/lib/http";
import { OFFER_MAX_LENGTH, sendOffer } from "@/lib/offers";
import { requireApiRole } from "@/lib/session";
import Shop from "@/models/Shop";

export const maxDuration = 60;

/** The owner sends an offer to all followers. Body: { text, endsOn?: "YYYY-MM-DD" }. */
export async function POST(req) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const { text, endsOn } = await readJson(req);
  const t = typeof text === "string" ? text.trim() : "";
  if (t.length < 3) return bad("Write the offer (at least a few words)");
  if (t.length > OFFER_MAX_LENGTH) return bad(`Keep it under ${OFFER_MAX_LENGTH} characters so it fits a notification`);
  let endsAt = null;
  if (endsOn) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endsOn)) return bad("Invalid end date");
    endsAt = new Date(`${endsOn}T23:59:59+05:30`);
    if (endsAt < new Date()) return bad("The end date has already passed");
  }
  const shop = await Shop.findById(user.shopId).lean();
  if (!shop) return bad("Shop not found", 404);
  let res;
  try {
    res = await sendOffer(shop, { text: t, endsAt });
  } catch (err) {
    console.error("[offers] send failed:", err?.message || err);
    return Response.json({ error: "Couldn’t send the offer because of a server problem. It wasn’t counted; please try again." }, { status: 500 });
  }
  if (res.error) return bad(res.error, res.limit ? 429 : res.setup ? 503 : 403);
  const o = res.offer;
  return Response.json({ offer: { id: String(o._id), followers: o.followers, sentTo: o.sentTo, removed: o.removed } }, { status: 201 });
}
