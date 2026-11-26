// The admin's token switches (Admin → Token). Read often, changed rarely, so
// they are cached and refreshed the moment a switch is flipped.
import { revalidateTag, unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { termsVersionFor } from "@/lib/legal";
import AppSetting from "@/models/AppSetting";

export const TOKEN_SETTINGS_TAG = "token-settings";
export const SWITCH_KEYS = ["ownersTold", "legalOk", "burnsPaused"];

const plain = (s) => ({ on: Boolean(s?.on), at: s?.at ? new Date(s.at).toISOString() : null, by: s?.by || null });

export const getTokenSettings = unstable_cache(
  async () => {
    await connectDB();
    const doc = (await AppSetting.findById("token").lean()) || {};
    return {
      ownersTold: plain(doc.ownersTold),
      legalOk: plain(doc.legalOk),
      burnsPaused: plain(doc.burnsPaused),
      history: (doc.history || []).slice(-20).reverse().map((h) => ({ ...h, at: h.at ? new Date(h.at).toISOString() : null })),
    };
  },
  ["token-settings-v1"],
  { tags: [TOKEN_SETTINGS_TAG], revalidate: 300 }
);

/** The Terms version owners must have agreed to right now. */
export async function getTermsVersion() {
  return termsVersionFor((await getTokenSettings()).ownersTold.on);
}

export async function setTokenSwitch(key, on, by) {
  if (!SWITCH_KEYS.includes(key)) throw new Error("Unknown switch");
  await connectDB();
  const at = new Date();
  await AppSetting.updateOne(
    { _id: "token" },
    { $set: { [key]: { on: Boolean(on), at, by } }, $push: { history: { $each: [{ key, on: Boolean(on), at, by }], $slice: -200 } } },
    { upsert: true }
  );
  revalidateTag(TOKEN_SETTINGS_TAG, { expire: 0 });
}
