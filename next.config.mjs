/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Revisiting a page within 30 s is instant (client cache). Actions like
    // "mark as read" call router.refresh(), which still fetches fresh data.
    // Prefetched tabs ("static") are also kept for at most 30 s, so numbers
    // and new complaints are never more than half a minute old.
    staleTimes: { dynamic: 30, static: 30 },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // The QR poster reads these fonts from disk; make sure they ship with the
  // serverless functions on Vercel.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Phones must always fetch the latest service worker.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
    ];
  },
  outputFileTracingIncludes: {
    "/api/dashboard/qr": ["./assets/fonts/**"],
    "/api/admin/shops/[id]/qr": ["./assets/fonts/**"],
  },
};

export default nextConfig;
