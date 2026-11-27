import { timingSafeEqual } from "node:crypto";
import { cleanupAll } from "@/lib/cleanup";
import { connectDB } from "@/lib/db";
import { getRawKeepMonths } from "@/lib/dataSettings";
import { runDailyBurns } from "@/lib/token";
import { deleteUnusedOfferPhotos } from "@/lib/imageStore";
import Offer from "@/models/Offer";

// Runs once a day from Vercel Cron (see vercel.json). Deletes raw records
// older than the admin's setting (2 or 3 months, Admin → Services); the
// owner's numbers do not change.
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
  const result = await cleanupAll({ months: await getRawKeepMonths(), budgetMs: 35_000 });
  console.log("[cleanup]", JSON.stringify(result));
  // Then the RBT burn for the days that just ended (does nothing until set up).
  let tokenBurn;
  try {
    tokenBurn = await runDailyBurns();
  } catch (err) {
    tokenBurn = { status: "error", error: String(err?.message || err).slice(0, 300) };
  }
  console.log("[token-burn]", JSON.stringify(tokenBurn));
  // Offer photos uploaded but never sent (removed or abandoned), older than a day.
  let photos;
  try {
    const used = await Offer.distinct("imageUrl", { imageUrl: { $exists: true } });
    photos = await deleteUnusedOfferPhotos(new Set(used));
  } catch (err) {
    photos = { error: String(err?.message || err).slice(0, 200) };
  }
  console.log("[offer-photos]", JSON.stringify(photos));
  return Response.json({ ...result, tokenBurn, photos });
}
