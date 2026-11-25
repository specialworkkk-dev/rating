"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatINR } from "@/lib/pricing";
import StatusBadge from "./StatusBadge";
import { btnPrimary, btnSecondary, card, fmtDate, smallInputClass as input } from "./ui";

const toInputDate = (iso) => (iso ? iso.slice(0, 10) : "");

export default function BillingPanel({ shop }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState(toInputDate(shop.trialEndsAt));
  const [paidUntil, setPaidUntil] = useState(toInputDate(shop.paidUntil));
  const [price, setPrice] = useState(String(shop.monthlyPrice));
  const priceChanged = price !== String(shop.monthlyPrice);

  async function patch(body) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/shops/${shop.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setError(json?.error || "Couldn’t update");
    setTrialEndsAt(toInputDate(json.shop.trialEndsAt));
    setPaidUntil(toInputDate(json.shop.paidUntil));
    setPrice(String(json.shop.monthlyPrice));
    router.refresh();
  }

  return (
    <section className={`${card} space-y-4`}>
      <div className="flex items-center gap-2">
        <h2 className="font-semibold">Plan &amp; payment</h2>
        <StatusBadge shop={shop} />
      </div>
      <p className="text-sm text-muted">
        {shop.status === "trial" && `Free trial until ${fmtDate(shop.trialEndsAt)}.`}
        {shop.status === "active" &&
          (shop.paidUntil ? `Paid until ${fmtDate(shop.paidUntil)}.` : "Paid, with no end date.")}
        {shop.status === "paused" && "Paused: the rating page shows “service paused”."}{" "}
        The rating page pauses automatically when the trial or paid period ends.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          patch({ monthlyPrice: Number(price) });
        }}
        className="flex flex-wrap items-end gap-3 rounded-xl bg-stone-50 p-4"
      >
        <label className="block">
          <span className="text-xs font-medium text-muted">Monthly price for this shop</span>
          <span className="mt-1 flex items-center rounded-lg border border-stone-300 bg-white focus-within:border-brand-500">
            <span className="pl-3 text-sm text-muted">₹</span>
            <input
              type="number"
              min={0}
              max={1000000}
              step={1}
              inputMode="numeric"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-28 bg-transparent px-2 py-2 text-sm tabular-nums outline-none"
            />
            <span className="pr-3 text-sm text-muted">/ month</span>
          </span>
        </label>
        <button type="submit" disabled={busy || !priceChanged} className={btnSecondary}>
          Save price
        </button>
        <p className="w-full text-xs text-muted">
          Set any amount you agreed with this shop. Use 0 for a free shop. It only counts towards
          revenue while the shop is paid.
        </p>
      </form>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || priceChanged} onClick={() => patch({ action: "extendPaid", months: 1 })} className={btnPrimary}>
          Mark paid +1 month ({formatINR(shop.monthlyPrice)})
        </button>
        <button type="button" disabled={busy || priceChanged} onClick={() => patch({ action: "extendPaid", months: 12 })} className={btnSecondary}>
          +12 months ({formatINR(shop.monthlyPrice * 12)})
        </button>
        {shop.status === "paused" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: shop.paidUntil ? "active" : "trial" })}
            className={btnSecondary}
          >
            Resume
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => patch({ status: "paused" })} className={btnSecondary}>
            Pause now
          </button>
        )}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-stone-600">Edit dates manually</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs text-muted">Status</span>
            <select
              defaultValue={shop.status}
              key={shop.status}
              disabled={busy}
              onChange={(e) => patch({ status: e.target.value })}
              className={input}
            >
              <option value="trial">Trial</option>
              <option value="active">Paid</option>
              <option value="paused">Paused</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-muted">Trial ends</span>
            <input
              type="date"
              value={trialEndsAt}
              disabled={busy}
              onChange={(e) => setTrialEndsAt(e.target.value)}
              onBlur={() => trialEndsAt !== toInputDate(shop.trialEndsAt) && patch({ trialEndsAt: trialEndsAt || null })}
              className={input}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted">Paid until</span>
            <input
              type="date"
              value={paidUntil}
              disabled={busy}
              onChange={(e) => setPaidUntil(e.target.value)}
              onBlur={() => paidUntil !== toInputDate(shop.paidUntil) && patch({ paidUntil: paidUntil || null })}
              className={input}
            />
          </label>
        </div>
      </details>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
