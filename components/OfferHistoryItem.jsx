"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtNum } from "@/lib/format";

/** One sent offer with its numbers, and permanent delete. */
export default function OfferHistoryItem({ offer }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/dashboard/offers/${offer.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError("Couldn’t delete. Please try again.");
    router.refresh();
  }

  const Row = ({ label, value, note }) => (
    <div className="flex items-baseline gap-3 py-1">
      <dt className="w-40 shrink-0 text-muted">{label}</dt>
      <dd className="w-14 text-right font-semibold tabular-nums">{fmtNum(value)}</dd>
      {note && <dd className="text-xs text-muted">{note}</dd>}
    </div>
  );

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
        <p className="min-w-0 flex-1 font-semibold break-words">{offer.text}</p>
        <p className="shrink-0 text-xs text-muted">Sent {offer.sentLabel}</p>
      </div>
      {offer.endsLabel && <p className="mt-0.5 text-xs text-muted">Valid till {offer.endsLabel}</p>}
      <dl className="mt-2 border-t border-stone-100 pt-1 text-sm">
        <Row label="Followers" value={offer.followers} />
        <Row label="Sent to" value={offer.sentTo} note="✓" />
        <Row label="No longer following" value={offer.removed} note="(removed automatically)" />
      </dl>
      <div className="mt-2">
        {asking ? (
          <span className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-red-800">Delete this offer and its numbers permanently?</span>
            <button type="button" onClick={remove} disabled={busy} className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white disabled:opacity-60">
              {busy ? "Deleting…" : "Delete"}
            </button>
            <button type="button" onClick={() => setAsking(false)} className="rounded-lg px-3 py-1.5 text-stone-600 hover:bg-stone-100">
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setAsking(true)} className="text-sm text-stone-500 hover:text-red-700">
            🗑 Delete
          </button>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </li>
  );
}
