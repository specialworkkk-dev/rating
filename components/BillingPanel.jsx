"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import StatusBadge from "./StatusBadge";
import { btnPrimary, btnSecondary, card, fmtDate, smallInputClass as input } from "./ui";

const toInputDate = (iso) => (iso ? iso.slice(0, 10) : "");

export default function BillingPanel({ shop }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState(toInputDate(shop.trialEndsAt));
  const [paidUntil, setPaidUntil] = useState(toInputDate(shop.paidUntil));

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

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => patch({ action: "extendPaid", months: 1 })} className={btnPrimary}>
          Mark paid +1 month (₹499)
        </button>
        <button type="button" disabled={busy} onClick={() => patch({ action: "extendPaid", months: 12 })} className={btnSecondary}>
          +12 months
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
