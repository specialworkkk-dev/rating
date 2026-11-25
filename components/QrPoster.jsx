"use client";

import { useState } from "react";
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
  const nfcUrl = `${ratingUrl}?src=nfc`;
  const v = encodeURIComponent(version);

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
              src={`${endpoint}?format=png&preview=1&v=${v}`}
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
            <a href={`${endpoint}?format=pdf&size=${size}&v=${v}`} className={btnPrimary} download>
              Download PDF
            </a>
            <a href={`${endpoint}?format=png&v=${v}`} className={btnSecondary} download>
              Poster PNG
            </a>
            <a href={`${endpoint}?format=qr&v=${v}`} className={btnSecondary} download>
              QR code only
            </a>
          </div>
          <p className="text-xs text-muted">
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
