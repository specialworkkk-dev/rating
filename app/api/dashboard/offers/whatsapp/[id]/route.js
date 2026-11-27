import mongoose from "mongoose";
import { bad } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import WhatsAppOptIn from "@/models/WhatsAppOptIn";

/** The owner removes a number from their WhatsApp offers list (e.g. the customer asked to stop). */
export async function DELETE(_req, { params }) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid id");
  await WhatsAppOptIn.deleteOne({ _id: id, shopId: user.shopId });
  return Response.json({ ok: true });
}
