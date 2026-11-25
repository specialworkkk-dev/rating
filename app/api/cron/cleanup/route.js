import { timingSafeEqual } from "node:crypto";
import { cleanupAll } from "@/lib/cleanup";
import { connectDB } from "@/lib/db";

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
  const result = await cleanupAll({ budgetMs: 45_000 });
  console.log("[cleanup]", JSON.stringify(result));
  return Response.json(result);
}
