"use client";

import { useEffect, useState } from "react";
import { fmtNum } from "@/lib/format";

const OPTIONS = [
  { key: "1m", label: "1 month" },
  { key: "3m", label: "3 months" },
  { key: "1y", label: "1 year" },
  { key: "years", label: "Custom" },
];

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/**
 * Lets the owner permanently delete old messages: pick an age, see exactly how
 * many messages that is, then confirm. Star ratings are never deleted.
 */
export default function FeedbackCleanup({ onClose, onDeleted }) {
  const [olderThan, setOlderThan] = useState("3m");
  const [years, setYears] = useState(2);
  const [preview, setPreview] = useState(null); // { count, cutoff }
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const yearsValid = Number.isInteger(years) && years >= 1 && years <= 10;
  const body = { olderThan, ...(olderThan === "years" ? { years } : {}) };

  // Count what would be deleted whenever the choice changes.
  useEffect(() => {
    setArmed(false);
    setPreview(null);
    setError("");
    if (olderThan === "years" && !yearsValid) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await fetch("/api/dashboard/feedback/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => null);
      const json = res?.ok ? await res.json().catch(() => null) : null;
      if (cancelled) return;
      if (!json) setError("Couldn’t check. Please try again.");
      else setPreview(json);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [olderThan, years]);

  async function remove() {
    if (!armed) return setArmed(true);
    setBusy(true);
    setError("");
    const res = await fetch("/api/dashboard/feedback/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, confirm: true }),
    }).catch(() => null);
    const json = res?.ok ? await res.json().catch(() => null) : null;
    setBusy(false);
    if (!json) return setError("Couldn’t delete. Please try again.");
    onDeleted(json.deleted);
  }

  return (
    <div className="mt-4 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Clean up old messages</h3>
          <p className="mt-0.5 text-sm text-muted">
            Permanently delete messages older than the period you choose. Star ratings and your
            dashboard numbers are not affected.
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-stone-500 hover:bg-stone-200/60 hover:text-ink" aria-label="Close">
          ✕
        </button>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Delete messages older than</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {OPTIONS.map((o) => (
            <label
              key={o.key}
              className={`cursor-pointer rounded-xl border px-3.5 py-2 text-sm ${
                olderThan === o.key ? "border-stone-900 bg-white font-medium" : "border-stone-300 bg-white/60 text-stone-600"
              }`}
            >
              <input type="radio" name="older-than" value={o.key} checked={olderThan === o.key} onChange={() => setOlderThan(o.key)} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
        {olderThan === "years" && (
          <label className="mt-3 flex items-center gap-2 text-sm">
            Older than
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              value={Number.isNaN(years) ? "" : years}
              onChange={(e) => setYears(e.target.value === "" ? NaN : Number(e.target.value))}
              className="w-20 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm tabular-nums outline-none focus:border-stone-900"
            />
            years
            {!yearsValid && <span className="text-red-600">Enter 1 to 10</span>}
          </label>
        )}
      </fieldset>

      <div className="mt-4 rounded-xl bg-white p-3.5 text-sm ring-1 ring-stone-200" aria-live="polite">
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : !preview ? (
          <span className="text-muted">{olderThan === "years" && !yearsValid ? "Choose how many years." : "Checking…"}</span>
        ) : preview.count === 0 ? (
          <span className="text-muted">No messages from before {dateFmt.format(new Date(preview.cutoff))}. Nothing to delete.</span>
        ) : (
          <span>
            <strong className="tabular-nums">{fmtNum(preview.count)}</strong> {preview.count === 1 ? "message" : "messages"} received before{" "}
            <strong>{dateFmt.format(new Date(preview.cutoff))}</strong> will be <strong className="text-red-700">permanently deleted</strong>. This can’t be undone.
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!preview?.count || busy}
          onClick={remove}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy
            ? "Deleting…"
            : armed
              ? `Yes, delete ${fmtNum(preview?.count || 0)} for good`
              : `Delete ${preview?.count ? fmtNum(preview.count) : ""} ${preview?.count === 1 ? "message" : "messages"}`}
        </button>
        {armed && !busy && (
          <button type="button" onClick={() => setArmed(false)} className="text-sm font-medium text-stone-600 hover:text-ink">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
