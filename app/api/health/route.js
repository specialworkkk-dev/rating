import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { imageStore } from "@/lib/imageStore";
import { vapidStatus } from "@/lib/offers";

export const dynamic = "force-dynamic";

/**
 * Health check. A free uptime monitor can call this every 5 minutes, which
 * also keeps the app and its database connection warm (fewer slow cold starts).
 */
export async function GET() {
  const t = Date.now();
  try {
    await connectDB();
    await mongoose.connection.db.admin().ping();
    // Offers notification keys: "ok", "missing" or "invalid" (never the keys).
    const offers = vapidStatus();
    return Response.json(
      // photos: where offer photos are stored ("r2", "cloudinary" or "off"), never the keys.
      { ok: true, db: "up", ms: Date.now() - t, offers: offers.status, ...(offers.reason ? { offersReason: offers.reason } : {}), photos: imageStore() || "off" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
