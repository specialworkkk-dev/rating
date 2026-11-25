import { requireApiRole } from "@/lib/session";
import { getFeedbackPage } from "@/lib/stats";

// GET ?status=all|unread|read&stars=1|2|3&q=text&page=N&per=5|10|15|25
export async function GET(req) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const p = new URL(req.url).searchParams;
  const status = ["unread", "read"].includes(p.get("status")) ? p.get("status") : "all";
  const stars = Number(p.get("stars")) || null;
  return Response.json(
    await getFeedbackPage(user.shopId, {
      status,
      stars,
      q: p.get("q") || "",
      page: Number(p.get("page")) || 1,
      pageSize: Number(p.get("per")) || undefined,
    })
  );
}
