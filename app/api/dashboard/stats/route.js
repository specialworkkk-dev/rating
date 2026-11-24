import { normalizeRange, getShopStats, sinceFor } from "@/lib/stats";
import { requireApiRole } from "@/lib/session";

export async function GET(req) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const range = normalizeRange(new URL(req.url).searchParams.get("range"));
  return Response.json({ range, ...(await getShopStats(user.shopId, sinceFor(range))) });
}
