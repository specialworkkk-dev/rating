import mongoose from "mongoose";
import { bad } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import Offer from "@/models/Offer";

/** The owner deletes one offer and its numbers, permanently. */
export async function DELETE(_req, { params }) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid offer id");
  const r = await Offer.deleteOne({ _id: id, shopId: user.shopId });
  if (!r.deletedCount) return bad("Offer not found", 404);
  return Response.json({ ok: true });
}
