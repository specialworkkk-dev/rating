// Bring database indexes in line with the models (safe to run repeatedly).
// Usage: npm run migrate                       (local .env.local database)
//        MONGODB_URI="mongodb+srv://..." npm run migrate   (any other database)
import mongoose from "mongoose";
import Feedback from "../models/Feedback.js";
import RateLimit from "../models/RateLimit.js";
import Rating from "../models/Rating.js";
import Scan from "../models/Scan.js";
import Shop from "../models/Shop.js";
import ShopTotals from "../models/ShopTotals.js";
import { recomputeDays, recomputeMonths, recomputeTotals } from "../lib/totals.js";
import ShopDay from "../models/ShopDay.js";
import DirectTap from "../models/DirectTap.js";
import ShopMonth from "../models/ShopMonth.js";
import User from "../models/User.js";

await mongoose.connect(process.env.MONGODB_URI);
const host = mongoose.connection.host;
console.log(`Migrating ${mongoose.connection.name} on ${host}`);

for (const model of [User, Shop, Rating, Feedback, Scan, RateLimit, ShopTotals, ShopMonth, ShopDay, DirectTap]) {
  // syncIndexes creates missing indexes and drops ones the model no longer
  // defines, e.g. the old "one feedback per rating" unique index.
  const dropped = await model.syncIndexes();
  const names = (await model.listIndexes()).map((i) => i.name).join(", ");
  console.log(`  ${model.modelName.padEnd(9)} dropped: [${dropped.join(", ")}]  now: ${names}`);
}

// Recompute every shop's running all-time totals exactly from the raw data.
const shops = await Shop.find().select("_id").lean();
const t0 = Date.now();
for (const s of shops) {
  // Days before months: the monthly counts are added up from the days.
  await recomputeTotals(s._id);
  await recomputeDays(s._id);
  await recomputeMonths(s._id);
}
console.log(`  Totals    recomputed (all-time, monthly, daily) for ${shops.length} shops in ${Date.now() - t0} ms`);

await mongoose.disconnect();
console.log("Done.");
