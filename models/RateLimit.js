import mongoose from "mongoose";

// One document per (key, time window). MongoDB deletes it automatically after
// the window ends (TTL index), so the collection stays tiny.
const RateLimitSchema = new mongoose.Schema(
  {
    _id: String,
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { versionKey: false }
);

export default mongoose.models.RateLimit || mongoose.model("RateLimit", RateLimitSchema);
