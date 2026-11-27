"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtNum } from "@/lib/format";
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
export default function OfferComposer({ shopName, followers, used, limit, disabled }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [group, setGroup] = useState(0);
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
      body: JSON.stringify({ text, endsOn: endsOn || undefined }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    setConfirming(false);
    if (!res?.ok) return setMsg({ type: "error", text: json?.error || "Couldn’t send. Please try again." });
    setMsg({ type: "ok", text: `✓ Sent to ${fmtNum(json.offer.sentTo)} follower${json.offer.sentTo === 1 ? "" : "s"}.` });
    setText("");
    setEndsOn("");
    router.refresh();
  }

  return (
    <section className={`${card} space-y-4`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-semibold">New offer</h2>
        <span className={`text-sm ${left > 0 ? "text-muted" : "font-semibold text-red-700"}`}>
          {used} of {limit} offers used this month
        </span>
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
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={disabled || text.trim().length < 3 || left <= 0}
          className={`${btnPrimary} w-full py-3 sm:w-auto`}
        >
          🔔 Send offer
        </button>
      )}
    </section>
  );
}
