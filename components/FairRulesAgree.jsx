"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FairReviewRules from "./FairReviewRules";
import { btnPrimary, card } from "./ui";

/**
 * Shown on the owner dashboard until the owner agrees to the Terms of Service
 * and the fair-review rules. `rulesDone`: the rules were agreed earlier, so
 * only the (new) Terms are asked for.
 */
export default function FairRulesAgree({ rulesDone = false }) {
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
        <h2 className="text-lg font-semibold">{rulesDone ? "Please agree to our Terms of Service" : "Before you start: our terms and Google’s review rules"}</h2>
        <p className="mt-1 text-sm text-muted">
          {rulesDone
            ? "Our Terms of Service have been updated. Please read them and agree to keep using your dashboard."
            : "These keep your Google reviews safe. Please read them and agree to continue."}
        </p>
      </div>
      {!rulesDone && <FairReviewRules />}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 size-4 accent-stone-900"
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="font-medium text-brand-700 underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="font-medium text-brand-700 underline">
            Privacy Policy
          </Link>
          {rulesDone ? "." : ", and my staff and I will follow these rules."}
        </span>
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
