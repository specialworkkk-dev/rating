import mongoose from "mongoose";
import { bad, readJson } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import Feedback from "@/models/Feedback";

export async function PATCH(req, { params }) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid id");
  const { isRead = true } = await readJson(req);

  // Scoped to the owner's shop: an owner can never touch another shop's feedback.
  const res = await Feedback.updateOne(
    { _id: id, shopId: user.shopId },
    { $set: { isRead: Boolean(isRead) } }
  );
  if (res.matchedCount === 0) return bad("Feedback not found", 404);
  return Response.json({ ok: true });
}

/**
 * The owner permanently deletes one message from the database. Only the
 * written message goes; the customer's star rating stays, so stats are honest.
 */
export async function DELETE(_req, { params }) {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid id");
  const res = await Feedback.deleteOne({ _id: id, shopId: user.shopId });
  if (res.deletedCount === 0) return bad("Feedback not found", 404);
  return Response.json({ ok: true, deleted: 1 });
}
