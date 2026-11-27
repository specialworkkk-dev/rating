import "./globals.css";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: BRAND.name,
  description: BRAND.tagline,
  icons: { icon: "/icon.png" },
  // Changes with every deploy; the app's service worker compares it (public/sw.js).
  other: { "rb-build": process.env.NEXT_PUBLIC_BUILD_ID || "dev" },
};

// Installed app: when the service worker says a newer version (or a logout)
// replaced the saved page, reload. Plain script, so it works even before
// React starts.
const SW_RELOAD = `if("serviceWorker"in navigator&&location.pathname.indexOf("/app/")===0){navigator.serviceWorker.addEventListener("message",function(e){if(e.data&&e.data.type==="rb-reload")location.reload()})}`;

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f59e0b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: SW_RELOAD }} />
        {children}
      </body>
    </html>
  );
}
