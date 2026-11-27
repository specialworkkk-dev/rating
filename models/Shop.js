import mongoose from "mongoose";

const ShopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    logoUrl: String,
    googlePlaceId: { type: String, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    alertEmail: { type: String, lowercase: true, trim: true },
    // Who the admin calls about this shop (seen only by the admin).
    contactName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    contactPhone2: { type: String, trim: true },
    contactNotes: { type: String, trim: true },
    status: { type: String, enum: ["trial", "active", "paused"], default: "trial" },
    trialEndsAt: Date,
    paidUntil: Date,
    plan: { type: String, enum: ["basic", "premium"], default: "basic" },
    // What this shop pays per month, in rupees. Set per shop by the admin.
    monthlyPrice: { type: Number, default: 499, min: 0, max: 1_000_000 },
    // Offers (premium): send offers to followers' phones. Its own price,
    // added to monthlyPrice, and a monthly sending limit. Set by the admin.
    offersEnabled: { type: Boolean, default: false },
    offersPrice: { type: Number, default: 199, min: 0, max: 1_000_000 },
    offersMonthlyLimit: { type: Number, default: 8, min: 1, max: 100 },
    // When the owner agreed to the fair-review rules (Google policy), and how:
    // in their dashboard ("owner") or in person when the admin set them up ("admin").
    rulesAcceptedAt: Date,
    rulesAcceptedVia: { type: String, enum: ["owner", "admin"] },
    // The Terms of Service version the owner agreed to (see lib/legal.js), and when.
    termsVersion: Number,
    termsAcceptedAt: Date,
    // When the shop was last paused, for the "delete within 90 days" reminder.
    pausedAt: Date,
    // The owner's answer to the "delete feedback older than 2 months?" pop-up:
    // asked again 2 months after answering; "later" snoozes it for a week.
    feedbackReminder: { answeredAt: Date, snoozeUntil: Date },
  },
  { timestamps: true }
);

ShopSchema.pre("save", function () {
  if (this.isModified("status")) this.pausedAt = this.status === "paused" ? new Date() : undefined;
});

export default mongoose.models.Shop || mongoose.model("Shop", ShopSchema);
