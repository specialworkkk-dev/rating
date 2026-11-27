// Every 2 months the owner is asked whether to delete feedback older than 2
// months (it holds customers' names and phone numbers). It's only a question:
// if they keep it or ignore it, nothing is deleted.
import Feedback from "@/models/Feedback";

export const REMINDER_MONTHS = 2;
export const SNOOZE_DAYS = 7;

const monthsAgo = (n, now = new Date()) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() - n);
  return d;
};

/** Number of old messages to ask about, or 0 when the pop-up shouldn't show now. */
export async function feedbackReminderCount(shop, now = new Date()) {
  const r = shop?.feedbackReminder || {};
  if (r.snoozeUntil && new Date(r.snoozeUntil) > now) return 0;
  if (r.answeredAt && new Date(r.answeredAt) > monthsAgo(REMINDER_MONTHS, now)) return 0;
  return Feedback.countDocuments({ shopId: shop._id, createdAt: { $lt: monthsAgo(REMINDER_MONTHS, now) } });
}
