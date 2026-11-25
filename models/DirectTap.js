import mongoose from "mongoose";

// A tap on "Review on Google" on the first rating screen (before choosing
// stars). Not tied to a rating; counted as "Direct to Google".
const DirectTapSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    deviceId: String,
    ipHash: String,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

DirectTapSchema.index({ shopId: 1, createdAt: -1 });
DirectTapSchema.index({ shopId: 1, deviceId: 1, createdAt: -1 });

export default mongoose.models.DirectTap || mongoose.model("DirectTap", DirectTapSchema);
