import "./globals.css";

export const metadata = {
  title: "Review Booster",
  description: "Get more Google reviews and catch unhappy customers privately.",
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
