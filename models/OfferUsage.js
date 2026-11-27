import mongoose from "mongoose";

// Offers sent per shop per Indian calendar month. Kept separately so that
// deleting an offer doesn't give its slot back ("3 of 8 used" stays 3).
const OfferUsageSchema = new mongoose.Schema(
  {
    _id: String, // `${shopId}:${YYYY-MM}`
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    month: String,
    sent: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export default mongoose.models.OfferUsage || mongoose.model("OfferUsage", OfferUsageSchema);
