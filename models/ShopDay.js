import mongoose from "mongoose";

// Running per-day counts for each shop (Indian calendar days), so daily
// charts and the figures table read one small document per day instead of
// every rating. About 365 documents per shop per year.
const ShopDaySchema = new mongoose.Schema(
  {
    _id: String, // `${shopId}:${YYYY-MM-DD}`
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    day: { type: String, required: true }, // "YYYY-MM-DD"
    happy: { type: Number, default: 0 },
    unhappy: { type: Number, default: 0 },
    stars: { type: Number, default: 0 }, // sum of all star values, for the average
    google: { type: Number, default: 0 },
    scans: { type: Number, default: 0 },
  },
  { versionKey: false }
);

ShopDaySchema.index({ shopId: 1, day: 1 });

export default mongoose.models.ShopDay || mongoose.model("ShopDay", ShopDaySchema);
