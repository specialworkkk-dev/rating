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
    direct: { type: Number, default: 0 }, // "Review on Google" taps on the first screen
    recomputedAt: Date,
    // Old raw records (ratings, scans, direct taps) are deleted after a few
    // months to save space (lib/cleanup.js). Before they go, their counts are
    // added here, so a recount = archived + the raw records still kept.
    archivedBefore: String, // IST day "YYYY-MM-DD": raw records before this day are gone
    archived: {
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
      direct: { type: Number, default: 0 },
    },
    // True once this shop's per-month counts (ShopMonth) were built from an
    // exact recount; until then the monthly chart builds them first.
    monthsReady: { type: Number, default: 0 }, // = ROLLUP_VERSION once built
    // Same for the per-day counts (ShopDay).
    daysReady: { type: Number, default: 0 }, // = ROLLUP_VERSION once built
  },
  { versionKey: false, timestamps: { createdAt: false, updatedAt: true } }
);

export default mongoose.models.ShopTotals || mongoose.model("ShopTotals", ShopTotalsSchema);
