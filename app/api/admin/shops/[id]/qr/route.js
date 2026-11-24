import mongoose from "mongoose";
import { bad } from "@/lib/http";
import { posterResponse } from "@/lib/poster";
import { requireApiRole } from "@/lib/session";
import { siteUrl } from "@/lib/site";
import Shop from "@/models/Shop";

export async function GET(req, { params }) {
  const { error } = await requireApiRole("admin");
  if (error) return error;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid shop id");
  const shop = await Shop.findById(id).lean();
  if (!shop) return bad("Shop not found", 404);
  return posterResponse(req, shop, `${await siteUrl()}/r/${shop.slug}`);
}
