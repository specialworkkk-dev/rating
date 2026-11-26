import mongoose from "mongoose";

// Admin switches that change behaviour without a redeploy. _id = "token".
// Every change is kept in `history` (who and when), as a record.
const Switch = { on: { type: Boolean, default: false }, at: Date, by: String };

const AppSettingSchema = new mongoose.Schema(
  {
    _id: String,
    ownersTold: Switch, // token section in the Terms; owners agree again
    legalOk: Switch, // lawyer and CA approved: real network allowed
    burnsPaused: Switch, // stop the daily burn
    history: [{ _id: false, key: String, on: Boolean, at: Date, by: String }],
  },
  { versionKey: false }
);

export default mongoose.models.AppSetting || mongoose.model("AppSetting", AppSettingSchema);
