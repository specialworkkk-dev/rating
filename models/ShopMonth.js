import mongoose from "mongoose";

// Running per-month counts for each shop (Indian calendar months), so the
// monthly chart reads 12 small documents instead of every rating.
const ShopMonthSchema = new mongoose.Schema(
  {
    _id: String, // `${shopId}:${YYYY-MM}`
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    month: { type: String, required: true }, // "YYYY-MM"
    happy: { type: Number, default: 0 },
    unhappy: { type: Number, default: 0 },
    stars: { type: Number, default: 0 }, // sum of all star values, for the average
    google: { type: Number, default: 0 },
    scans: { type: Number, default: 0 },
    direct: { type: Number, default: 0 }, // "Review on Google" taps on the first screen
  },
  { versionKey: false }
);

ShopMonthSchema.index({ shopId: 1, month: 1 });

export default mongoose.models.ShopMonth || mongoose.model("ShopMonth", ShopMonthSchema);
