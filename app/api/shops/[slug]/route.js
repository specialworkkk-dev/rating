import { connectDB } from "@/lib/db";
import { publicShop } from "@/lib/shop";
import Shop from "@/models/Shop";

export async function GET(_req, { params }) {
  const { slug } = await params;
  await connectDB();
  const shop = await Shop.findOne({ slug: String(slug).toLowerCase() }).lean();
  if (!shop) return Response.json({ error: "Shop not found" }, { status: 404 });
  return Response.json(publicShop(shop));
}
