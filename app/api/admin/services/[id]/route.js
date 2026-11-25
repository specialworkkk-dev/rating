import { bad, readJson } from "@/lib/http";
import { connectDB } from "@/lib/db";
import { getServiceSetting } from "@/lib/services";
import { SERVICES } from "@/lib/servicePlans";
import { requireApiRole } from "@/lib/session";
import ServiceSetting from "@/models/ServiceSetting";

/** Change a service's plan, monthly cost and limit (admin only). */
export async function PATCH(req, { params }) {
  const { error } = await requireApiRole("admin");
  if (error) return error;
  const { id } = await params;
  const service = SERVICES[id];
  if (!service) return bad("Unknown service", 404);

  const body = await readJson(req);
  const plan = service.plans.find((p) => p.id === body.plan);
  if (!plan) return bad("Choose a plan");
  const cost = Number(body.cost);
  const limit = Number(body.limit);
  if (!Number.isFinite(cost) || cost < 0 || cost > 10_000_000) return bad("Enter a monthly cost in ₹ (0 or more)");
  if (!Number.isFinite(limit) || limit <= 0 || limit > 1e12) return bad("Enter a limit above 0");

  await connectDB();
  await ServiceSetting.updateOne(
    { _id: id },
    { $set: { plan: plan.id, cost: Math.round(cost), limit: Math.round(limit) } },
    { upsert: true }
  );
  return Response.json({ ok: true, setting: await getServiceSetting(id) });
}
