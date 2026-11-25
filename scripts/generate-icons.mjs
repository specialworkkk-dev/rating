// Generates the app icons (home screen, Android maskable, iPhone, favicon)
// from the star logo. Run: node scripts/generate-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { createElement as h } from "react";
import { ImageResponse } from "next/dist/compiled/@vercel/og/index.node.js";

const AMBER = "#f59e0b";
const STAR = "M20 9.5l3.2 6.5 7.2 1-5.2 5.1 1.2 7.1L20 25.8l-6.4 3.4 1.2-7.1L9.6 17l7.2-1L20 9.5z";

/**
 * size: output pixels. rounded: draw the rounded square on transparency
 * (Android "any" icon). starScale: star size relative to the icon.
 */
function icon({ size, rounded, starScale }) {
  const star = size * starScale;
  return h(
    "div",
    {
      style: {
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: rounded ? "transparent" : AMBER,
      },
    },
    h(
      "div",
      {
        style: {
          width: rounded ? size * 0.9 : size,
          height: rounded ? size * 0.9 : size,
          borderRadius: rounded ? size * 0.22 : 0,
          background: AMBER,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      h("svg", { width: star, height: star, viewBox: "8 8 24 22.5" }, h("path", { d: STAR, fill: "#ffffff" }))
    )
  );
}

async function render(file, opts) {
  const img = new ImageResponse(icon(opts), { width: opts.size, height: opts.size });
  await writeFile(file, Buffer.from(await img.arrayBuffer()));
  console.log("wrote", file);
}

await mkdir("public/icons", { recursive: true });
await render("public/icons/icon-192.png", { size: 192, rounded: true, starScale: 0.5 });
await render("public/icons/icon-512.png", { size: 512, rounded: true, starScale: 0.5 });
// Maskable: full-bleed background, star inside the central safe zone.
await render("public/icons/maskable-512.png", { size: 512, rounded: false, starScale: 0.42 });
// iPhone home screen (iOS rounds the corners itself).
await render("public/icons/apple-touch-icon.png", { size: 180, rounded: false, starScale: 0.52 });
// Browser tab icon (Next.js picks up app/icon.png automatically).
await render("app/icon.png", { size: 64, rounded: true, starScale: 0.56 });
