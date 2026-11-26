import { timingSafeEqual } from "node:crypto";
import { cleanupAll } from "@/lib/cleanup";
import { connectDB } from "@/lib/db";
import { runDailyBurns } from "@/lib/token";

// Runs once a day from Vercel Cron (see vercel.json). Deletes raw records
// older than RAW_KEEP_MONTHS (default 3); the owner's numbers do not change.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // never runs until a secret is set
  const got = Buffer.from(req.headers.get("authorization") || "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function GET(req) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const result = await cleanupAll({ budgetMs: 35_000 });
  console.log("[cleanup]", JSON.stringify(result));
  // Then the RBT burn for the days that just ended (does nothing until set up).
  let tokenBurn;
  try {
    tokenBurn = await runDailyBurns();
  } catch (err) {
    tokenBurn = { status: "error", error: String(err?.message || err).slice(0, 300) };
  }
  console.log("[token-burn]", JSON.stringify(tokenBurn));
  return Response.json({ ...result, tokenBurn });
}
