// Admin setting: how many months of raw records (each rating, scan and Google
// tap) to keep before the nightly cleanup deletes them. Totals, charts and
// tables keep everything forever either way. Stored in the database (Admin →
// Services), so it changes with no redeploy.
import { revalidateTag, unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import AppSetting from "@/models/AppSetting";

export const RAW_KEEP_CHOICES = [2, 3];
export const DEFAULT_RAW_KEEP_MONTHS = 2;
const TAG = "data-settings";

export const getRawKeepSetting = unstable_cache(
  async () => {
    await connectDB();
    const doc = await AppSetting.findById("data").lean();
    const months = RAW_KEEP_CHOICES.includes(doc?.rawKeepMonths) ? doc.rawKeepMonths : DEFAULT_RAW_KEEP_MONTHS;
    return { months, at: doc?.rawKeepChangedAt ? new Date(doc.rawKeepChangedAt).toISOString() : null, by: doc?.rawKeepChangedBy || null };
  },
  ["raw-keep-v1"],
  { tags: [TAG], revalidate: 300 }
);

export const getRawKeepMonths = async () => (await getRawKeepSetting()).months;

export async function setRawKeepMonths(months, by) {
  if (!RAW_KEEP_CHOICES.includes(months)) throw new Error("Choose 2 or 3 months");
  await connectDB();
  await AppSetting.updateOne(
    { _id: "data" },
    { $set: { rawKeepMonths: months, rawKeepChangedAt: new Date(), rawKeepChangedBy: by } },
    { upsert: true }
  );
  revalidateTag(TAG, { expire: 0 });
}
