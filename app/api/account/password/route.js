import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { bad, readJson } from "@/lib/http";
import { MINUTE, rateLimit, tooMany } from "@/lib/rateLimit";
import { currentUser } from "@/lib/session";
import User from "@/models/User";

const MIN_PASSWORD = 8;

/**
 * Change your own password (admin or owner). Every login, on every device,
 * ends; the page then asks you to log in with the new password.
 */
export async function POST(req) {
  const me = await currentUser();
  if (!me) return Response.json({ error: "Please log in again." }, { status: 401 });

  const rl = await rateLimit(`pw:${me._id}`, { limit: 5, windowMs: 15 * MINUTE });
  if (!rl.ok) return tooMany(rl.retryAfter, "Too many attempts. Please wait 15 minutes and try again.");

  const { current, next } = await readJson(req);
  if (typeof current !== "string" || !current) return bad("Enter your current password");
  if (typeof next !== "string" || next.length < MIN_PASSWORD) return bad(`The new password must be at least ${MIN_PASSWORD} characters`);
  if (next.length > 200) return bad("That password is too long");
  if (next === current) return bad("The new password must be different from the current one");
  if (next.toLowerCase().includes(me.email.split("@")[0].toLowerCase()) && me.email.split("@")[0].length >= 4) {
    return bad("Don’t use your email name in the password");
  }

  await connectDB();
  const user = await User.findById(me._id).select("passwordHash pwv");
  if (!(await bcrypt.compare(current, user.passwordHash))) return bad("Your current password is wrong", 403);

  user.passwordHash = await bcrypt.hash(next, 10);
  user.pwv = (user.pwv || 0) + 1;
  user.passwordChangedAt = new Date();
  await user.save();
  return Response.json({ ok: true });
}
