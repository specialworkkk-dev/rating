import mongoose from "mongoose";

// One document per Indian calendar day: how many real ratings that day had,
// how many RBT were burned for them, and the blockchain transaction.
const TokenBurnSchema = new mongoose.Schema(
  {
    _id: String, // "YYYY-MM-DD"
    network: String,
    ratings: Number,
    tokens: Number, // whole tokens burned
    status: { type: String, enum: ["pending", "sent", "confirmed", "failed", "skipped"], default: "pending" },
    nonce: Number, // the burn wallet's transaction number reserved for this day
    txHash: String,
    blockNumber: Number,
    note: String,
    error: String,
    lockUntil: Date,
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.models.TokenBurn || mongoose.model("TokenBurn", TokenBurnSchema);
