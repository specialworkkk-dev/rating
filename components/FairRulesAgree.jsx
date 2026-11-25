"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FairReviewRules from "./FairReviewRules";
import { btnPrimary, card } from "./ui";

/** Shown on the owner dashboard until the owner agrees to the fair-review rules. */
export default function FairRulesAgree() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function agree() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/dashboard/rules", { method: "POST" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError("Couldn’t save. Please try again.");
    router.refresh();
  }

  return (
    <section className={`${card} space-y-4 ring-2 ring-amber-300`}>
      <div>
        <h2 className="text-lg font-semibold">Before you start: Google’s review rules</h2>
        <p className="mt-1 text-sm text-muted">
          These keep your Google reviews safe. Please read them and agree to continue.
        </p>
      </div>
      <FairReviewRules />
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 size-4 accent-stone-900"
        />
        <span>I have read these rules and my staff and I will follow them.</span>
      </label>
      <div className="flex items-center gap-3">
        <button type="button" disabled={!checked || busy} onClick={agree} className={btnPrimary}>
          {busy ? "Saving…" : "I agree"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}
