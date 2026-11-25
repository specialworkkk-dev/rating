import { bad } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import { getActivityTable } from "@/lib/stats";

// GET ?period=1m|3m|1y|custom&from=YYYY-MM-DD&to=YYYY-MM-DD&group=day|month
//     &empty=1&page=N&per=5|10|15|25
export async function GET(req) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const p = new URL(req.url).searchParams;
  const result = await getActivityTable(user.shopId, {
    period: p.get("period") || "1m",
    from: p.get("from") || undefined,
    to: p.get("to") || undefined,
    group: p.get("group") === "month" ? "month" : "day",
    empty: p.get("empty") === "1",
    page: Number(p.get("page")) || 1,
    pageSize: Number(p.get("per")) || undefined,
  });
  if (result.error) return bad(result.error);
  return Response.json(result);
}
