"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fmtNum } from "@/lib/format";
import { OFFER_TEMPLATES, offerCodeWord } from "@/lib/offerTemplates";
import OfferCard from "./OfferCard";
import ShopHeader from "./ShopHeader";
import { btnPrimary, btnSecondary, card } from "./ui";

// Emoji tabs for offers, grouped so owners find the right one fast.
const EMOJI_GROUPS = [
  { label: "🎉 Celebrate", items: ["🎉", "🎊", "🥳", "✨", "🎁", "🎈", "🎀", "🏆", "🥇", "🎯", "🎶", "💐"] },
  { label: "🍬 Food", items: ["🍬", "🍭", "🍫", "🍩", "🍰", "🧁", "🎂", "🍦", "🥛", "☕", "🍵", "🥤", "🍕", "🍔", "🍟", "🌮", "🍛", "🍜", "🍱", "🥗", "🍎", "🥭", "🍓", "🍉"] },
  { label: "🔥 Deals", items: ["🔥", "💥", "⭐", "🌟", "💯", "🏷️", "💰", "💸", "🛍️", "🛒", "🆕", "🆓", "➕", "✅", "👉", "📣"] },
  { label: "🪔 Festivals", items: ["🪔", "🎆", "🎇", "🌸", "🕉️", "🪷", "🎄", "🎅", "🌙", "⭐", "🇮🇳", "🪁", "🌈", "🥁", "🎑", "🧨"] },
  { label: "⏰ Time", items: ["⏰", "⌛", "⏳", "📅", "🗓️", "☀️", "🌅", "🌙", "🕔", "🚀", "⚡", "🔔"] },
  { label: "😍 Love", items: ["😍", "🤩", "😋", "🥰", "❤️", "💛", "💚", "👍", "🙏", "👌", "🤝", "😊"] },
  { label: "🛍️ Shops", items: ["💇‍♀️", "💅", "💄", "👗", "👟", "👜", "💍", "📱", "💻", "📚", "✏️", "💊", "🦷", "🏋️", "🚗", "🐶"] },
];
const MAX = 200;
const initials = (name) => {
  const w = String(name || "").trim().split(/\s+/);
  return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase();
};

/** Write an offer, see how the notification will look, and send it to all followers. */
/** Shrink a phone photo in the browser (max 1280 px, JPEG) so it uploads fast even on mobile data. */
async function shrinkPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That file isn’t a photo we can read"));
      i.src = url;
    });
    const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function OfferComposer({ shopName, logoUrl, mapsUrl, phone, followers, used, limit, disabled, initialText = "", canUploadPhoto = false }) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [withCode, setWithCode] = useState(true);
  const [codeTyped, setCodeTyped] = useState(null); // null = follow the offer text
  const digits = useRef(String(Math.floor(1000 + Math.random() * 9000)));
  const code = codeTyped ?? `${offerCodeWord(text)}-${digits.current}`;
  const [endsOn, setEndsOn] = useState("");
  const [group, setGroup] = useState(0);
  const [previewing, setPreviewing] = useState(false);

  // While the preview is open, the page behind it doesn't scroll (so the phone's
  // address bar doesn't resize and uncover it).
  useEffect(() => {
    if (!previewing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [previewing]);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type, text }
  const left = limit - used;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

  async function send() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/dashboard/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, endsOn: endsOn || undefined, imageUrl: imageUrl || undefined, code: withCode ? code : undefined }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    setConfirming(false);
    if (!res?.ok) return setMsg({ type: "error", text: json?.error || "Couldn’t send. Please try again." });
    setMsg({ type: "ok", text: `✓ Sent to ${fmtNum(json.offer.sentTo)} follower${json.offer.sentTo === 1 ? "" : "s"}.` });
    setText("");
    setEndsOn("");
    setImageUrl(null);
    setCodeTyped(null);
    digits.current = String(Math.floor(1000 + Math.random() * 9000));
    router.refresh();
  }

  async function pickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const small = await shrinkPhoto(file);
      const body = new FormData();
      body.append("file", new File([small], "offer.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/dashboard/offers/image", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Couldn’t upload the photo");
      setImageUrl(json.url);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className={`${card} space-y-4`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-semibold">New offer</h2>
        <span className={`text-sm ${left > 0 ? "text-muted" : "font-semibold text-red-700"}`}>
          {used} of {limit} offers used this month
        </span>
      </div>

      {/* Ready-made offers: tap, then edit. */}
      <div>
        <p className="text-xs font-medium text-muted">Ready-made offers (tap one, then edit)</p>
        <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1">
          {OFFER_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => setText(t.text)}
              className="shrink-0 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-stone-700 hover:bg-stone-200 disabled:opacity-40"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="sr-only">Offer text</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={3}
          placeholder="e.g. 🎉 10% off all sweets this weekend!"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          disabled={disabled}
        />
        <span className="mt-1 flex items-center justify-between text-xs text-muted">
          <span>Tap an emoji to add it</span>
          <span className="shrink-0 tabular-nums">
            {text.length}/{MAX}
          </span>
        </span>
      </label>

      {/* Emoji tabs */}
      <div className="rounded-xl ring-1 ring-stone-200">
        <div className="flex gap-1 overflow-x-auto border-b border-stone-100 p-1.5" role="tablist" aria-label="Emoji groups">
          {EMOJI_GROUPS.map((g, i) => (
            <button
              key={g.label}
              type="button"
              role="tab"
              aria-selected={group === i}
              onClick={() => setGroup(i)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs whitespace-nowrap ${group === i ? "bg-stone-900 font-semibold text-white" : "text-stone-600 hover:bg-stone-100"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-0.5 p-1.5 sm:grid-cols-12">
          {EMOJI_GROUPS[group].items.map((e, i) => (
            <button
              key={`${e}-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => setText((t) => (t + e).slice(0, MAX))}
              className="rounded-lg py-1.5 text-xl leading-none hover:bg-stone-100 disabled:opacity-40"
              aria-label={`Add ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <label className="block w-fit">
        <span className="text-sm font-medium">
          Valid till <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          type="date"
          min={today}
          value={endsOn}
          onChange={(e) => setEndsOn(e.target.value)}
          disabled={disabled}
          className="mt-1 block rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        />
      </label>

      {/* Photo (optional) */}
      <div>
        <p className="text-sm font-medium">
          Photo <span className="font-normal text-muted">(optional, shows big in the notification on Android)</span>
        </p>
        {imageUrl ? (
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="size-20 rounded-xl object-cover ring-1 ring-stone-200" />
            <button type="button" onClick={() => setImageUrl(null)} className="text-sm text-stone-500 hover:text-red-700">
              Remove photo
            </button>
          </div>
        ) : canUploadPhoto ? (
          <label className={`${btnSecondary} mt-2 cursor-pointer ${disabled || uploading ? "pointer-events-none opacity-50" : ""}`}>
            {uploading ? "Uploading…" : "📷 Add a photo"}
            <input type="file" accept="image/*" onChange={pickPhoto} className="hidden" disabled={disabled || uploading} />
          </label>
        ) : (
          <p className="mt-1 text-xs text-muted">Photo uploads are being set up. You can send offers without a photo.</p>
        )}
      </div>

      {/* Counter code */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={withCode} onChange={(e) => setWithCode(e.target.checked)} disabled={disabled} className="size-4 accent-stone-900" />
          Show a code to bring to the counter
        </label>
        {withCode && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              value={code}
              onChange={(e) => setCodeTyped(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20))}
              disabled={disabled}
              className="w-44 rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm tracking-wider uppercase"
              aria-label="Counter code"
            />
            <span className="text-xs text-muted">Staff tap “+1 used” in Sent offers when a customer shows it.</span>
          </div>
        )}
      </div>

      {/* How the notification will look on a phone. */}
      <div>
        <p className="text-xs font-medium text-muted">Preview</p>
        <div className="mt-1 flex items-start gap-3 rounded-2xl bg-stone-100 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-xs font-bold text-brand-700">
            {initials(shopName)}
          </span>
          <span className="min-w-0 text-sm">
            <span className="block font-semibold">{shopName}</span>
            <span className="block break-words text-stone-700">{text || "Your offer appears here"}</span>
          </span>
        </div>
      </div>

      {msg && <p className={`text-sm ${msg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>{msg.text}</p>}

      {previewing && (
        // Dark cover for the tallest screen size (browser bars hidden), so the page never peeks through.
        <div className="fixed inset-x-0 top-0 z-50 h-[100lvh] bg-stone-950" aria-hidden="true" />
      )}
      {previewing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-stone-950 px-4 pt-4 pb-0" role="dialog" aria-modal="true" aria-label="Offer preview">
          <p className="mt-2 shrink-0 text-sm font-semibold text-white">What customers see when they tap your offer</p>
          {/* The notification itself */}
          <div className="mt-3 w-full max-w-sm shrink-0 overflow-hidden rounded-2xl bg-white/95 shadow-lg">
            <div className="flex items-start gap-3 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">{initials(shopName)}</span>
              <span className="min-w-0 text-sm">
                <span className="block font-semibold">{shopName}</span>
                <span className="block break-words text-stone-700">{text || "Your offer appears here"}</span>
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {imageUrl && <img src={imageUrl} alt="" className="max-h-40 w-full object-cover" />}
          </div>
          <p className="mt-2 shrink-0 text-xs text-white/80">↓ after tapping it (scroll to see it all)</p>
          {/* The page, inside a phone frame */}
          {/* shrink-0: keep the full height and let the overlay scroll (never squeeze and cut). */}
          <div className="mt-2 w-full max-w-sm shrink-0 overflow-hidden rounded-[2rem] border-[6px] border-stone-800 bg-stone-50 shadow-2xl">
            <div className="flex min-h-[28rem] flex-col px-5 pt-8 pb-6">
              <ShopHeader name={shopName} logoUrl={logoUrl} />
              <OfferCard
                shopName={shopName}
                mapsUrl={mapsUrl}
                phone={phone}
                text={text}
                endsAt={endsOn ? `${endsOn}T23:59:59+05:30` : null}
                imageUrl={imageUrl}
                code={withCode ? code : null}
              />
              <p className="mt-4 text-center text-sm text-stone-500 underline">Stop offers from {shopName}</p>
            </div>
          </div>
          {/* Always reachable while scrolling. */}
          <div className="sticky bottom-0 mt-4 flex w-full max-w-sm shrink-0 gap-2 bg-stone-950 pt-3 pb-4">
            <button type="button" onClick={() => setPreviewing(false)} className="flex-1 rounded-xl bg-white py-3 font-semibold text-ink">
              ✏️ Edit
            </button>
            <button
              type="button"
              disabled={disabled || text.trim().length < 3 || left <= 0}
              onClick={() => {
                setPreviewing(false);
                setConfirming(true);
              }}
              className="flex-1 rounded-xl bg-brand-500 py-3 font-semibold text-white disabled:opacity-50"
            >
              🔔 Send this offer
            </button>
          </div>
        </div>
      )}

      {confirming ? (
        <div className="space-y-3 rounded-xl bg-amber-50 p-3 text-sm ring-1 ring-amber-200">
          <p>
            Send this offer to <b>{fmtNum(followers)}</b> follower{followers === 1 ? "" : "s"} now? It uses 1 of your {limit} offers this
            month, even if you delete it later.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={send} disabled={busy} className={btnPrimary}>
              {busy ? "Sending…" : "Yes, send"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => setPreviewing(true)} disabled={text.trim().length < 3} className={`${btnSecondary} w-full py-3 sm:w-auto`}>
            👁 Preview page
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={disabled || text.trim().length < 3 || left <= 0}
            className={`${btnPrimary} w-full py-3 sm:w-auto`}
          >
            🔔 Send offer
          </button>
        </div>
      )}
    </section>
  );
}
