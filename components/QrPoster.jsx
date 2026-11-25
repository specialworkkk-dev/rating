"use client";

import { useEffect, useRef, useState } from "react";
import CopyButton from "./CopyButton";
import { btnPrimary, btnSecondary, card } from "./ui";

const SIZES = [
  { key: "a4", label: "A4 poster", hint: "wall / door" },
  { key: "a5", label: "A5 standee", hint: "counter" },
  { key: "a6", label: "A6 table card", hint: "tables" },
];

/**
 * Poster preview + downloads. `endpoint` is the QR route for the current
 * viewer: /api/dashboard/qr for an owner, /api/admin/shops/<id>/qr for admin.
 * `version` busts the preview cache after the shop name / logo changes.
 */
export default function QrPoster({ endpoint, ratingUrl, version = "" }) {
  const [size, setSize] = useState("a5");
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);
  const previewSrc = `${endpoint}?format=png&preview=1&v=${encodeURIComponent(version)}`;

  // The image can finish loading before React attaches onLoad (fast or cached
  // responses), and then onLoad never fires. Check the element directly too.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) {
      if (img.naturalWidth > 0) setLoaded(true);
      else setFailed(true);
    }
  }, [previewSrc]);
  const nfcUrl = `${ratingUrl}?src=nfc`;
  const v = encodeURIComponent(version);
  const [busy, setBusy] = useState(null); // which download is being prepared
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  // Once the preview is showing, quietly prepare the PDF for the selected
  // paper size on the server (A5 by default, and again whenever the size
  // changes), so tapping "Download PDF" is quick. Each file is built once per
  // shop version and then kept, so this costs nothing on later visits.
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      fetch(`${endpoint}?format=pdf&size=${size}&warm=1&v=${v}`).catch(() => {});
      fetch(`${endpoint}?format=qr&warm=1&v=${v}`).catch(() => {}); // cheap; cached after the first time
    }, 400);
    return () => clearTimeout(t);
  }, [loaded, size, endpoint, v]);

  /** Fetch the file with a visible loader, then hand it to the browser to save. */
  async function download(key, query, filename) {
    if (busy) return;
    setBusy(key);
    setDone(null);
    setError("");
    try {
      const res = await fetch(`${endpoint}?${query}&v=${v}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      // Use the server's file name (includes the shop), falling back to ours.
      const named = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") || "")?.[1];
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = named || filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10_000);
      setDone(key);
      setTimeout(() => setDone((d) => (d === key ? null : d)), 3000);
    } catch {
      setError("Couldn’t prepare the file. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  // A plain helper (not a component defined inside this one), so React keeps
  // the same button between renders.
  const dlButton = ({ id, query, filename, primary, children }) => (
    <button
      key={id}
      type="button"
      onClick={() => download(id, query, filename)}
      disabled={Boolean(busy)}
      aria-busy={busy === id}
      className={`${primary ? btnPrimary : btnSecondary} min-w-32 gap-2 disabled:cursor-wait ${busy && busy !== id ? "opacity-50" : ""}`}
    >
      {busy === id ? (
        <>
          <span className={`size-4 animate-spin rounded-full border-2 ${primary ? "border-white/30 border-t-white" : "border-stone-300 border-t-stone-700"}`} aria-hidden="true" />
          Preparing…
        </>
      ) : done === id ? (
        <>✓ Downloaded</>
      ) : (
        children
      )}
    </button>
  );

  return (
    <section id="poster" className={`${card} scroll-mt-20`}>
      <h2 className="font-semibold">QR poster</h2>
      <p className="mt-1 text-sm text-muted">
        Print it and put it where customers pay. Scanning opens your rating page.
      </p>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row">
        <div className="relative mx-auto aspect-[1/1.414] w-48 shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200 sm:mx-0 sm:w-56">
          {!failed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={previewSrc}
              alt="QR poster preview"
              className={`size-full object-contain transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
          )}
          {!loaded && (
            <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted">
              {failed ? "Preview unavailable" : "Loading preview…"}
            </p>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <fieldset>
            <legend className="text-sm font-medium">Paper size</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <label
                  key={s.key}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                    size === s.key ? "border-ink bg-stone-50 font-medium" : "border-stone-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="poster-size"
                    value={s.key}
                    checked={size === s.key}
                    onChange={() => setSize(s.key)}
                    className="sr-only"
                  />
                  {s.label} <span className="text-muted">· {s.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            {dlButton({ id: `pdf-${size}`, query: `format=pdf&size=${size}`, filename: `rating-poster-${size}.pdf`, primary: true, children: "Download PDF" })}
            {dlButton({ id: "png", query: "format=png", filename: "rating-poster.png", children: "Poster PNG" })}
            {dlButton({ id: "qr", query: "format=qr", filename: "qr-code.png", children: "QR code only" })}
          </div>
          <p className="text-xs text-muted">
            {error && <span className="mb-1 block text-red-600">{error}</span>}
            The PDF prints edge to edge at the chosen size. “QR code only” is for printers who design
            their own standee.
          </p>

          <div className="space-y-2 border-t border-stone-100 pt-4 text-sm">
            <LinkRow label="Rating link" url={ratingUrl} />
            <LinkRow label="NFC card link" url={nfcUrl} hint="Write this to NFC tap cards so taps are counted separately." />
          </div>
        </div>
      </div>
    </section>
  );
}

function LinkRow({ label, url, hint }) {
  return (
    <div>
      <p className="font-medium">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <code className="min-w-0 rounded-lg bg-stone-100 px-3 py-2 text-xs break-all">{url}</code>
        <CopyButton text={url} label="Copy" />
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
