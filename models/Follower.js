import mongoose from "mongoose";

// A phone/browser that tapped "Follow for offers" on a shop's page.
// Only the browser's push delivery address and keys: no IP, no name, no
// phone number, and no link to any rating.
const FollowerSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    endpoint: { type: String, required: true }, // e.g. https://fcm.googleapis.com/fcm/send/...
    keys: { p256dh: { type: String, required: true }, auth: { type: String, required: true } },
    device: String, // "Android", "iPhone", "Computer" (for counts only)
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

FollowerSchema.index({ shopId: 1, endpoint: 1 }, { unique: true });

export default mongoose.models.Follower || mongoose.model("Follower", FollowerSchema);
