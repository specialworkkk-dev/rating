import mongoose from "mongoose";

// A customer who asked to get a shop's offers on WhatsApp (mostly iPhone
// users). The shop sends them itself with the free WhatsApp Business app.
const WhatsAppOptInSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    phone: { type: String, required: true }, // "+91 98765 43210"
    name: { type: String, trim: true, maxlength: 80 },
    consentText: String, // exactly what they agreed to
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

WhatsAppOptInSchema.index({ shopId: 1, phone: 1 }, { unique: true });
WhatsAppOptInSchema.index({ shopId: 1, createdAt: -1 });

export default mongoose.models.WhatsAppOptIn || mongoose.model("WhatsAppOptIn", WhatsAppOptInSchema);
