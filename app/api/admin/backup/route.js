import mongoose from "mongoose";
import { revalidateTag } from "next/cache";
import { collectionsFor } from "@/lib/backup";
import { connectDB } from "@/lib/db";
import { SERVICES_TAG } from "@/lib/services";
import { requireApiRole } from "@/lib/session";
import ServiceSetting from "@/models/ServiceSetting";

// Download a backup of the database (admin only).
//   ?type=essential  shops, logins, feedback, all figures, settings (small)
//   ?type=full       the same plus raw ratings, scans and Google taps
// Format: gzip-compressed lines of MongoDB Extended JSON, one record per
// line ({"c": collection, "d": document}), so ids and dates survive exactly.
// Restore with: node scripts/restore.mjs <file>
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const { EJSON } = mongoose.mongo.BSON;

export async function GET(req) {
  const { error } = await requireApiRole("admin");
  if (error) return error;
  await connectDB();
  const db = mongoose.connection.db;
  const type = new URL(req.url).searchParams.get("type") === "full" ? "full" : "essential";
  const names = collectionsFor(type);
  const enc = new TextEncoder();
  const now = new Date();

  let i = 0;
  let cursor = null;
  const counts = {};
  const stream = new ReadableStream({
    async start(controller) {
      const meta = { app: "review-booster", type, createdAt: now.toISOString(), database: db.databaseName, collections: names };
      controller.enqueue(enc.encode(JSON.stringify({ meta }) + "\n"));
    },
    // Send records in batches as the browser reads them, so memory stays small.
    async pull(controller) {
      try {
        while (i < names.length) {
          if (!cursor) cursor = db.collection(names[i]).find({}, { batchSize: 1000 });
          const lines = [];
          while (lines.length < 1000 && (await cursor.hasNext())) {
            lines.push(EJSON.stringify({ c: names[i], d: await cursor.next() }, { relaxed: false }));
          }
          if (lines.length) {
            counts[names[i]] = (counts[names[i]] || 0) + lines.length;
            controller.enqueue(enc.encode(lines.join("\n") + "\n"));
            return;
          }
          await cursor.close();
          cursor = null;
          i += 1;
        }
        controller.enqueue(enc.encode(JSON.stringify({ end: true, counts }) + "\n"));
        controller.close();
      } catch (err) {
        console.error("[backup] failed", err?.message);
        controller.error(err);
        return;
      }
      // Remember it for the Services page. A failure here never breaks the file.
      try {
        await ServiceSetting.updateOne({ _id: "mongodb" }, { $set: { lastBackup: { at: now, type, counts } } }, { upsert: true });
        revalidateTag(SERVICES_TAG, { expire: 0 }); // the "no backup" reminder goes away
      } catch (err) {
        console.error("[backup] could not record the backup", err?.message);
      }
    },
    async cancel() {
      await cursor?.close();
    },
  });

  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
  return new Response(stream.pipeThrough(new CompressionStream("gzip")), {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="review-booster-${type}-backup-${day}.ndjson.gz"`,
      "Cache-Control": "no-store",
    },
  });
}
