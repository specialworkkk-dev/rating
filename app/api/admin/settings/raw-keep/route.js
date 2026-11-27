import { bad, readJson } from "@/lib/http";
import { RAW_KEEP_CHOICES, setRawKeepMonths } from "@/lib/dataSettings";
import { requireApiRole } from "@/lib/session";

/** Admin: keep raw records for 2 or 3 months. Body: { months }. */
export async function PATCH(req) {
  const { user, error } = await requireApiRole("admin");
  if (error) return error;
  const { months } = await readJson(req);
  if (!RAW_KEEP_CHOICES.includes(months)) return bad("Choose 2 or 3 months");
  await setRawKeepMonths(months, user.email);
  return Response.json({ ok: true, months });
}
