"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fmtNum } from "@/lib/format";

/**
 * Pop-up on the owner's dashboard every 2 months: delete feedback older than
 * 2 months? Only a suggestion. Keep or "later" deletes nothing.
 */
export default function FeedbackReminder({ count }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const firstButton = useRef(null);

  useEffect(() => {
    firstButton.current?.focus();
    const onKey = (e) => e.key === "Escape" && answer("later");
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function answer(action) {
    setBusy(action);
    setError("");
    await fetch("/api/dashboard/feedback/reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => {});
    setBusy("");
    setOpen(false);
  }

  async function remove() {
    setBusy("delete");
    setError("");
    const res = await fetch("/api/dashboard/feedback/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ olderThan: "2m", confirm: true }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setBusy("");
      return setError(json?.error || "Couldn’t delete. Please try again.");
    }
    await fetch("/api/dashboard/feedback/reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleted" }),
    }).catch(() => {});
    setBusy("");
    setDone(json.deleted || 0);
    router.refresh();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="fr-title">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {done != null ? (
          <>
            <p className="text-3xl" aria-hidden="true">
              ✅
            </p>
            <h2 id="fr-title" className="mt-2 text-lg font-semibold">
              Deleted {fmtNum(done)} old message{done === 1 ? "" : "s"}
            </h2>
            <p className="mt-1 text-sm text-muted">Your ratings and figures are unchanged. We’ll ask again in 2 months.</p>
            <button type="button" onClick={() => setOpen(false)} className="mt-5 w-full rounded-xl bg-ink py-3 font-semibold text-white">
              OK
            </button>
          </>
        ) : (
          <>
            <p className="text-3xl" aria-hidden="true">
              🧹
            </p>
            <h2 id="fr-title" className="mt-2 text-lg font-semibold">
              Clean up old feedback?
            </h2>
            <p className="mt-1 text-sm text-stone-700">
              You have <b>{fmtNum(count)}</b> feedback message{count === 1 ? "" : "s"} older than 2 months. They may include customers’
              names and phone numbers. Deleting them keeps your inbox tidy and protects your customers’ privacy.
            </p>
            <p className="mt-2 text-xs text-muted">It’s your choice. Your ratings, charts and figures are never affected.</p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 space-y-2">
              <button
                ref={firstButton}
                type="button"
                onClick={remove}
                disabled={Boolean(busy)}
                className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-60"
              >
                {busy === "delete" ? "Deleting…" : `Delete ${fmtNum(count)} old message${count === 1 ? "" : "s"}`}
              </button>
              <button
                type="button"
                onClick={() => answer("keep")}
                disabled={Boolean(busy)}
                className="w-full rounded-xl border border-stone-300 py-3 font-semibold text-ink disabled:opacity-60"
              >
                Keep them
              </button>
              <button type="button" onClick={() => answer("later")} disabled={Boolean(busy)} className="w-full py-2 text-sm text-stone-500">
                Remind me later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
