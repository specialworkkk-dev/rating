import { bad, readJson } from "@/lib/http";
import { SNOOZE_DAYS } from "@/lib/feedbackReminder";
import { requireApiRole } from "@/lib/session";
import Shop from "@/models/Shop";

/**
 * The owner answers the "old feedback" pop-up.
 * { action: "keep" | "deleted" } → asked again in 2 months; "later" → in a week.
 */
export async function POST(req) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const { action } = await readJson(req);
  const now = new Date();
  if (action === "keep" || action === "deleted") {
    await Shop.updateOne({ _id: user.shopId }, { $set: { "feedbackReminder.answeredAt": now }, $unset: { "feedbackReminder.snoozeUntil": 1 } });
  } else if (action === "later") {
    await Shop.updateOne({ _id: user.shopId }, { $set: { "feedbackReminder.snoozeUntil": new Date(now.getTime() + SNOOZE_DAYS * 864e5) } });
  } else return bad("Unknown action");
  return Response.json({ ok: true });
}
