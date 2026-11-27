import mongoose from "mongoose";

// One offer a shop sent to its followers, with its delivery numbers.
const OfferSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    text: { type: String, required: true, trim: true, maxlength: 200 },
    endsAt: Date, // optional "valid till"
    sentAt: { type: Date, default: Date.now },
    followers: { type: Number, default: 0 }, // followers when it was sent
    sentTo: { type: Number, default: 0 }, // accepted by the push services
    removed: { type: Number, default: 0 }, // no longer following (deleted automatically)
    failed: { type: Number, default: 0 }, // temporary errors
  },
  { versionKey: false }
);

OfferSchema.index({ shopId: 1, sentAt: -1 });

export default mongoose.models.Offer || mongoose.model("Offer", OfferSchema);
