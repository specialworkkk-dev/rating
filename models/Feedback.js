import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    ratingId: { type: mongoose.Schema.Types.ObjectId, ref: "Rating", index: true },
    deviceId: String,
    ipHash: String,
    stars: { type: Number, min: 1, max: 5 },
    name: { type: String, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 20 },
    // A second message from the same device on the same day is appended here.
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

FeedbackSchema.index({ shopId: 1, isRead: 1, createdAt: -1 });
FeedbackSchema.index({ shopId: 1, deviceId: 1, createdAt: -1 });

export default mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
