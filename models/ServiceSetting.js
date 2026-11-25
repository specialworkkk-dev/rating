import mongoose from "mongoose";

// The admin's choices for each outside service (plan, monthly cost, limit),
// plus the last run of the daily cleanup. _id = "vercel" | "mongodb".
const ServiceSettingSchema = new mongoose.Schema(
  {
    _id: String,
    plan: String, // a plan id from lib/servicePlans.js
    cost: Number, // ₹ per month, as the admin entered it
    limit: Number, // function calls / month (Vercel) or MB (MongoDB)
    lastCleanup: {
      at: Date,
      deletedBefore: String,
      keepMonths: Number,
      shops: Number,
      shopsDone: Number,
      deleted: { ratings: Number, scans: Number, direct: Number },
    },
  },
  { versionKey: false, timestamps: { createdAt: false, updatedAt: true } }
);

export default mongoose.models.ServiceSetting || mongoose.model("ServiceSetting", ServiceSettingSchema);
