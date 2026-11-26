import { requireApiRole } from "@/lib/session";
import { runDailyBurns } from "@/lib/token";

export const maxDuration = 60;

/** Admin: run the RBT burn now for any due days (also retries failed ones). Never burns a day twice. */
export async function POST() {
  const { error } = await requireApiRole("admin");
  if (error) return error;
  return Response.json(await runDailyBurns());
}
