import { BRAND } from "@/lib/brand";

// Attached only to app pages (login, owner, admin) so customers on a rating
// page are never invited to install the owners' app.
export const appMetadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const appViewport = { themeColor: "#ffffff" };
