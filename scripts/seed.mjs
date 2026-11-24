// Creates (or updates) a demo shop so the rating page can be tried at /r/demo-cafe.
// Usage: npm run seed            (reads MONGODB_URI from .env.local)
//        SEED_PLACE_ID=ChIJ... npm run seed   (use a real Google Place ID)
import mongoose from "mongoose";
import Shop from "../models/Shop.js";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

await mongoose.connect(uri);

const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
const shop = await Shop.findOneAndUpdate(
  { slug: "demo-cafe" },
  {
    $set: {
      name: "Demo Café",
      // Google's documented example Place ID; replace with the shop's real one.
      googlePlaceId: process.env.SEED_PLACE_ID || "ChIJN1t_tDeuEmsRUsoyG83frY4",
      status: "trial",
      trialEndsAt,
    },
  },
  { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
);

console.log(`Seeded shop "${shop.name}" → /r/${shop.slug} (trial until ${trialEndsAt.toDateString()})`);
await mongoose.disconnect();
