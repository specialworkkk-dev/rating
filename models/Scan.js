import mongoose from "mongoose";

const ScanSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    source: { type: String, enum: ["qr", "nfc"], default: "qr" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

ScanSchema.index({ shopId: 1, createdAt: -1 });

export default mongoose.models.Scan || mongoose.model("Scan", ScanSchema);
