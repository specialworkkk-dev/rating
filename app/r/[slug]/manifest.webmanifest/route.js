import { getPublicShop } from "@/lib/shopCache";

// A tiny app manifest per shop, so an iPhone customer can "Add to Home
// Screen" and then get that shop's offer notifications (Apple only allows
// notifications for home-screen web apps).
export async function GET(_req, { params }) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop || !shop.offers) return new Response("Not found", { status: 404 });
  const icon = shop.logoUrl || "/icon.png";
  return Response.json(
    {
      id: `/r/${shop.slug}`,
      name: shop.name,
      short_name: shop.name.slice(0, 12),
      start_url: `/r/${shop.slug}`,
      scope: `/r/${shop.slug}`,
      display: "standalone",
      background_color: "#fafaf9",
      theme_color: "#fafaf9",
      icons: [
        { src: icon, sizes: "192x192", type: "image/png" },
        { src: icon, sizes: "512x512", type: "image/png" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } }
  );
}
