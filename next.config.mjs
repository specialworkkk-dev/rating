/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // The QR poster reads these fonts from disk; make sure they ship with the
  // serverless functions on Vercel.
  outputFileTracingIncludes: {
    "/api/dashboard/qr": ["./assets/fonts/**"],
    "/api/admin/shops/[id]/qr": ["./assets/fonts/**"],
  },
};

export default nextConfig;
