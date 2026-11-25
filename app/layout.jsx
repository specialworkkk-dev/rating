import "./globals.css";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: BRAND.name,
  description: BRAND.tagline,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f59e0b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
