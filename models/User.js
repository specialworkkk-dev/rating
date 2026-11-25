import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "owner"], default: "owner" },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    pushTokens: { type: [String], default: [] },
    // Goes up by one whenever the password changes. Logins made before that
    // carry the old number and stop working, on every device.
    pwv: { type: Number, default: 0 },
    passwordChangedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
