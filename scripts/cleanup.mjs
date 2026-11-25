// Delete raw records older than RAW_KEEP_MONTHS (default 3) by hand.
// The same job runs every day on Vercel (/api/cron/cleanup).
// Usage: npm run cleanup
//        RAW_KEEP_MONTHS=6 npm run cleanup
import mongoose from "mongoose";
import { cleanupAll } from "../lib/cleanup.js";

await mongoose.connect(process.env.MONGODB_URI);
console.log(`Cleaning ${mongoose.connection.name} on ${mongoose.connection.host}`);
console.log(await cleanupAll({ budgetMs: Infinity }));
await mongoose.disconnect();
