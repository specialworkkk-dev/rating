import { getFeedbackList } from "@/lib/stats";
import { requireApiRole } from "@/lib/session";

export async function GET(req) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const unreadOnly = new URL(req.url).searchParams.get("filter") === "unread";
  return Response.json({ feedback: await getFeedbackList(user.shopId, { unreadOnly }) });
}
