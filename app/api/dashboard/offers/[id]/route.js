import mongoose from "mongoose";
import { bad, readJson } from "@/lib/http";
import { deleteImage } from "@/lib/imageStore";
import { requireApiRole } from "@/lib/session";
import Offer from "@/models/Offer";

/** The owner deletes one offer and its numbers, permanently. */
export async function DELETE(_req, { params }) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid offer id");
  const offer = await Offer.findOneAndDelete({ _id: id, shopId: user.shopId }).select("imageUrl").lean();
  if (!offer) return bad("Offer not found", 404);
  if (offer.imageUrl) await deleteImage(offer.imageUrl); // its photo goes too
  return Response.json({ ok: true });
}

/** Staff count a customer who showed the offer at the counter. Body: { change: 1 | -1 }. */
export async function PATCH(req, { params }) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid offer id");
  const { change } = await readJson(req);
  if (change !== 1 && change !== -1) return bad("change must be 1 or -1");
  const filter = { _id: id, shopId: user.shopId, ...(change < 0 ? { redeemed: { $gt: 0 } } : {}) };
  const offer = await Offer.findOneAndUpdate(filter, { $inc: { redeemed: change } }, { new: true }).select("redeemed").lean();
  if (!offer) return bad("Offer not found", 404);
  return Response.json({ redeemed: offer.redeemed });
}
