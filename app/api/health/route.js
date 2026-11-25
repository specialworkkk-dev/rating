import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

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
    return Response.json({ ok: true, db: "up", ms: Date.now() - t }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
