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
  const [redeemed, setRedeemed] = useState(offer.redeemed || 0);
  const [counting, setCounting] = useState(false);

  async function count(change) {
    setCounting(true);
    setError("");
    const res = await fetch(`/api/dashboard/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setCounting(false);
    if (!res?.ok) return setError("Couldn’t update. Please try again.");
    setRedeemed(json.redeemed);
  }

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
        {offer.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={offer.imageUrl} alt="" className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-stone-200" />
        )}
        <p className="min-w-0 flex-1 font-semibold break-words">{offer.text}</p>
        <p className="shrink-0 text-xs text-muted">Sent {offer.sentLabel}</p>
      </div>
      {(offer.endsLabel || offer.code) && (
        <p className="mt-0.5 text-xs text-muted">
          {offer.endsLabel && `Valid till ${offer.endsLabel}`}
          {offer.endsLabel && offer.code && " · "}
          {offer.code && (
            <>
              Code <span className="font-mono font-semibold text-ink">{offer.code}</span>
            </>
          )}
        </p>
      )}
      <dl className="mt-2 border-t border-stone-100 pt-1 text-sm">
        <Row label="Followers" value={offer.followers} />
        <Row label="Sent to" value={offer.sentTo} note="✓" />
        <Row label="No longer following" value={offer.removed} note="(removed automatically)" />
        {offer.code && (
          <div className="flex items-center gap-3 py-1">
            <dt className="w-40 shrink-0 text-muted">Used at counter</dt>
            <dd className="w-14 text-right font-semibold tabular-nums">{fmtNum(redeemed)}</dd>
            <dd className="flex gap-1">
              <button
                type="button"
                onClick={() => count(1)}
                disabled={counting}
                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
              >
                +1 used
              </button>
              {redeemed > 0 && (
                <button type="button" onClick={() => count(-1)} disabled={counting} className="rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-stone-100" aria-label="Undo one">
                  Undo
                </button>
              )}
            </dd>
          </div>
        )}
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
          <span className="flex items-center gap-4">
            <a href={offer.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-700 hover:underline">
              👁 View
            </a>
            <button type="button" onClick={() => setAsking(true)} className="text-sm text-stone-500 hover:text-red-700">
              🗑 Delete
            </button>
          </span>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </li>
  );
}
