import mongoose from "mongoose";

const RatingSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    clickedGoogle: { type: Boolean, default: false },
    source: { type: String, enum: ["qr", "nfc"], default: "qr" },
    // Random ID kept on the customer's phone (cookie + localStorage). One
    // rating per device per shop; rating again updates this document.
    deviceId: String,
    // Keyed hash of the IP, never the raw IP. Used to spot bursts from one network.
    ipHash: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Covering index for dashboard stats: shop + date range, with stars and the
// Google tap stored in the index, so counting ratings never has to open the
// documents themselves (fast even with lakhs of ratings per shop).
RatingSchema.index({ shopId: 1, createdAt: -1, stars: 1, clickedGoogle: 1 });
RatingSchema.index(
  { shopId: 1, deviceId: 1 },
  { unique: true, partialFilterExpression: { deviceId: { $type: "string" } } }
);
RatingSchema.index({ shopId: 1, ipHash: 1, createdAt: -1 });

export default mongoose.models.Rating || mongoose.model("Rating", RatingSchema);
