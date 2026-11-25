import mongoose from "mongoose";

// Running all-time totals per shop, updated with +1/-1 as events happen, so
// the "All time" dashboard reads one small document instead of every rating.
// `npm run migrate` recomputes them from the raw data (safe to run any time).
const ShopTotalsSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" }, // = shopId
    ratings: { type: Number, default: 0 },
    stars: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
    google: { type: Number, default: 0 },
    scans: { type: Number, default: 0 },
    recomputedAt: Date,
  },
  { versionKey: false, timestamps: { createdAt: false, updatedAt: true } }
);

export default mongoose.models.ShopTotals || mongoose.model("ShopTotals", ShopTotalsSchema);
