/** @type {import('next').NextConfig} */
// A marker that changes with every deploy, so installed apps notice a new
// version (see public/sw.js).
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || String(Date.now());

const nextConfig = {
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  experimental: {
    // Fewer, larger files for customers: most open one rating page from a QR
    // code and leave, so each extra request costs more than a bigger file.
    // (Every request counts towards Vercel's request allowance.)
    turbopackChunking: {
      priorityRoutes: [/^\/r\//],
      firstPageLoadPriority: 0.9,
      requestCost: 1_000_000,
      minChunkSize: 150_000,
      maxMergeChunkSize: 2_000_000,
      maxChunkCountPerGroup: 2,
    },
    // The stylesheet (~10 KB, Tailwind) goes inside the page: one request less.
    inlineCss: true,
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
  // The owner/admin app moved under /app (so an installed app only claims
  // /app/... links, never customers' /r/... rating links). Old addresses forward.
  async redirects() {
    return [
      { source: "/login", destination: "/app/login", permanent: false },
      { source: "/dashboard/:path*", destination: "/app/dashboard/:path*", permanent: false },
      { source: "/admin/:path*", destination: "/app/admin/:path*", permanent: false },
    ];
  },
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
        // Phones must always fetch the latest service workers (owner app and customer offers).
        source: "/:file(sw|offers-sw).js",
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
