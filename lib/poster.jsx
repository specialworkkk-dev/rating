import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";

// Every poster size is ISO A-series, so one layout (1 : √2) fits all of them.
export const POSTER_SIZES = {
  a4: { label: "A4 poster", pt: [595.28, 841.89] },
  a5: { label: "A5 standee", pt: [419.53, 595.28] },
  a6: { label: "A6 table card", pt: [297.64, 419.53] },
};

// ≈210 dpi at A4, ≈300 dpi at A5 / A6: sharp in print, and fast enough to
// render inside a serverless time limit. The QR itself is vector, so it is crisp.
const PRINT_WIDTH = 1754;
const PREVIEW_WIDTH = 620;

const COLORS = {
  cream: "#fff8eb",
  brand: "#f59e0b",
  brandDark: "#b45309",
  ink: "#1c1917",
  muted: "#78716c",
};

let fontsPromise;
function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Geist-Regular.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Geist-Bold.ttf")),
  ]).then(([regular, bold]) => [
    { name: "Geist", data: regular, weight: 400, style: "normal" },
    { name: "Geist", data: bold, weight: 700, style: "normal" },
  ]);
  return fontsPromise;
}

/** The QR code alone as SVG markup (vector, so it stays sharp at any size). */
export function qrSvg(url) {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "Q", // survives scratches / glare on a printed standee
    margin: 0,
    color: { dark: COLORS.ink, light: "#ffffff" },
  });
}

/** The QR code alone as a PNG (for shops that design their own standee). */
export function qrPng(url) {
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "Q",
    margin: 2,
    width: 1200,
    color: { dark: COLORS.ink, light: "#ffffff" },
  });
}

/**
 * Fetch the shop logo as a data URI so a slow or broken logo URL can't break
 * the poster. Cloudinary logos are converted to a square PNG on the fly.
 */
async function logoDataUri(logoUrl) {
  if (!logoUrl) return null;
  let url = logoUrl;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    url = url.replace("/upload/", "/upload/f_png,w_400,h_400,c_fill/");
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const type = (res.headers.get("content-type") || "").split(";")[0];
    if (!res.ok || !["image/png", "image/jpeg", "image/svg+xml"].includes(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 3 * 1024 * 1024) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function Star({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill={COLORS.brand}
        d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z"
      />
    </svg>
  );
}

// The image renderer (Satori) puts uneven gaps after some words when it wraps
// on normal spaces. Non-breaking spaces render evenly, so text is joined with
// them and long shop names are wrapped into lines here instead.
const nb = (s) => s.replace(/ /g, "\u00a0");

function wrapWords(text, maxChars) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Font size and line breaks for the shop name, so it always fits the width. */
function nameLayout(name, u) {
  if (name.length <= 15) return { size: 8.5 * u, lines: [name] };
  if (name.length <= 40) return { size: 6.8 * u, lines: wrapWords(name, 20) };
  return { size: 5.2 * u, lines: wrapWords(name, 27) };
}

function Poster({ shop, url, qr, logo, width }) {
  const u = width / 100; // 1u = 1% of the poster width
  const height = Math.round(width * Math.SQRT2);
  const initials = shop.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const displayUrl = url.replace(/^https?:\/\//, "");
  const name = nameLayout(shop.name, u);

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: COLORS.cream,
        fontFamily: "Geist",
        color: COLORS.ink,
      }}
    >
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-around",
          padding: `${5 * u}px ${8 * u}px ${3 * u}px`,
        }}
      >
        {/* Shop identity */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img
              src={logo}
              width={16 * u}
              height={16 * u}
              style={{ borderRadius: 3.5 * u, objectFit: "cover", border: `${0.4 * u}px solid #e7e5e4` }}
            />
          ) : (
            <div
              style={{
                width: 16 * u,
                height: 16 * u,
                borderRadius: 3.5 * u,
                background: "#feeac7",
                color: COLORS.brandDark,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 6.5 * u,
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
          )}
          <div
            style={{
              marginTop: 3 * u,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: name.size,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {name.lines.map((line, i) => (
              <div key={i}>{nb(line)}</div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 6 * u, fontWeight: 700 }}>
            {nb("How was your visit?")}
          </div>
          <div style={{ marginTop: 1 * u, fontSize: 4.4 * u, color: COLORS.brandDark }}>
            {nb("Scan & rate us")}
          </div>
          <div style={{ marginTop: 1.8 * u, display: "flex", gap: 1.2 * u }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={6.5 * u} />
            ))}
          </div>
        </div>

        {/* QR code */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              padding: 4 * u,
              background: "#ffffff",
              borderRadius: 4 * u,
              border: `${0.8 * u}px solid ${COLORS.brand}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img src={qr} width={44 * u} height={44 * u} />
          </div>
          <div style={{ marginTop: 2.4 * u, fontSize: 2.8 * u, color: COLORS.muted }}>
            {nb("Point your phone camera at the code")}
          </div>
        </div>
      </div>

      {/* Footer band */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: `${3.2 * u}px ${6 * u}px`,
          background: COLORS.brand,
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 3.6 * u, fontWeight: 700 }}>{nb("Takes 10 seconds · No app needed")}</div>
        <div style={{ marginTop: 0.8 * u, fontSize: 2.2 * u, color: "#fff8eb" }}>{displayUrl}</div>
      </div>
    </div>
  );
}

/** Render the poster to PNG bytes. */
export async function renderPosterPng({ shop, url, preview = false }) {
  const width = preview ? PREVIEW_WIDTH : PRINT_WIDTH;
  const height = Math.round(width * Math.SQRT2);
  const [fonts, svg, logo] = await Promise.all([loadFonts(), qrSvg(url), logoDataUri(shop.logoUrl)]);
  const qr = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  const image = new ImageResponse(<Poster shop={shop} url={url} qr={qr} logo={logo} width={width} />, {
    width,
    height,
    fonts,
  });
  return Buffer.from(await image.arrayBuffer());
}

/** Wrap the PNG in a single-page PDF at the chosen paper size. */
export async function renderPosterPdf({ shop, url, size = "a4" }) {
  const png = await renderPosterPng({ shop, url });
  const [w, h] = (POSTER_SIZES[size] || POSTER_SIZES.a4).pt;
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${shop.name} – rating poster`);
  pdf.setCreator("Review Booster");
  const page = pdf.addPage([w, h]);
  const img = await pdf.embedPng(png);
  page.drawImage(img, { x: 0, y: 0, width: w, height: h });
  return Buffer.from(await pdf.save());
}

/**
 * Build the download response for GET …/qr.
 * Query: format=pdf|png|qr (default pdf), size=a4|a5|a6, preview=1, inline=1
 */
export async function posterResponse(req, shop, ratingUrl) {
  const q = new URL(req.url).searchParams;
  const format = ["pdf", "png", "qr"].includes(q.get("format")) ? q.get("format") : "pdf";
  const size = POSTER_SIZES[q.get("size")] ? q.get("size") : "a4";
  const preview = q.get("preview") === "1";
  const inline = preview || q.get("inline") === "1";

  let body, type, filename;
  if (format === "qr") {
    body = await qrPng(ratingUrl);
    type = "image/png";
    filename = `qr-${shop.slug}.png`;
  } else if (format === "png") {
    body = await renderPosterPng({ shop, url: ratingUrl, preview });
    type = "image/png";
    filename = `rating-poster-${shop.slug}.png`;
  } else {
    body = await renderPosterPdf({ shop, url: ratingUrl, size });
    type = "application/pdf";
    filename = `rating-poster-${shop.slug}-${size}.pdf`;
  }

  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      // Previews are versioned (?v=slug-updatedAt), so the browser can keep them;
      // downloads are always generated fresh.
      "Cache-Control": preview ? "private, max-age=86400" : "private, no-store",
    },
  });
}
