import { getPublicShop } from "@/lib/shopCache";

export async function GET(_req, { params }) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) return Response.json({ error: "Shop not found" }, { status: 404 });
  return Response.json(shop);
}
