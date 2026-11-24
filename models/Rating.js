import mongoose from "mongoose";

const RatingSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    clickedGoogle: { type: Boolean, default: false },
    source: { type: String, enum: ["qr", "nfc"], default: "qr" },
    userAgent: String,
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

RatingSchema.index({ shopId: 1, createdAt: -1 });

export default mongoose.models.Rating || mongoose.model("Rating", RatingSchema);
