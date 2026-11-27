"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnSecondary, card } from "./ui";

/** The phone shown on offer pages as "📞 Call shop" (optional). */
export default function ShopPhoneCard({ phone }) {
  const router = useRouter();
  const [value, setValue] = useState(phone || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/dashboard/offers/phone", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: value }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setMsg({ type: "error", text: json?.error || "Couldn’t save" });
    setValue(json.phone);
    setMsg({ type: "ok", text: json.phone ? "✓ Saved. Offers now show “📞 Call shop”." : "✓ Removed." });
    router.refresh();
  }

  return (
    <form onSubmit={save} className={`${card} space-y-2`}>
      <h2 className="font-semibold">📞 Call button on your offers</h2>
      <p className="text-xs text-muted">Customers can call you straight from an offer, for orders and bookings. Leave empty to hide the button.</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="tel"
          inputMode="tel"
          maxLength={20}
          placeholder="Shop phone, e.g. 98765 43210"
          className="w-56 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" disabled={busy} className={btnSecondary}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {msg && <p className={`text-sm ${msg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>{msg.text}</p>}
    </form>
  );
}
