// Restore a backup downloaded from Admin → Services into a database.
// Usage:
//   MONGODB_URI="mongodb+srv://.../review-booster-restored" node scripts/restore.mjs review-booster-full-backup-2026-11-25.ndjson.gz
// Safety: it refuses to write into a database that already has shops, so a
// restore can never mix with or overwrite live data. Restore into a new,
// empty database, check it, then point the app's MONGODB_URI at it.
import fs from "node:fs";
import readline from "node:readline";
import zlib from "node:zlib";
import mongoose from "mongoose";

const file = process.argv[2];
if (!file || !process.env.MONGODB_URI) {
  console.error("Usage: MONGODB_URI=... node scripts/restore.mjs <backup.ndjson.gz>");
  process.exit(1);
}
const { EJSON } = mongoose.mongo.BSON;

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
if (await db.collection("shops").estimatedDocumentCount()) {
  console.error(`"${db.databaseName}" already has shops. Restore into a new, empty database instead.`);
  await mongoose.disconnect();
  process.exit(1);
}

const lines = readline.createInterface({ input: fs.createReadStream(file).pipe(zlib.createGunzip()), crlfDelay: Infinity });
const batches = {};
const counts = {};
let meta = null;
let complete = false;
const flush = async (c) => {
  if (!batches[c]?.length) return;
  await db.collection(c).insertMany(batches[c], { ordered: false });
  counts[c] = (counts[c] || 0) + batches[c].length;
  batches[c] = [];
};
for await (const line of lines) {
  if (!line.trim()) continue;
  const row = EJSON.parse(line, { relaxed: false });
  if (row.meta) {
    meta = row.meta;
    console.log(`Backup of "${meta.database}" (${meta.type}) made ${meta.createdAt}`);
    continue;
  }
  if (row.end) {
    complete = true;
    continue;
  }
  (batches[row.c] ??= []).push(row.d);
  if (batches[row.c].length >= 1000) await flush(row.c);
}
for (const c of Object.keys(batches)) await flush(c);
console.log("Restored:", counts);
if (!complete) console.warn("⚠ The file ended early (the download may have been cut off). Some records may be missing.");
console.log(`Now run: MONGODB_URI="<same address>" npm run migrate   (rebuilds indexes)`);
await mongoose.disconnect();
