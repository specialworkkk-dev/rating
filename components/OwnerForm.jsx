"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FairReviewRules from "./FairReviewRules";
import { btnPrimary, card, fmtDate, smallInputClass as input } from "./ui";

export default function OwnerForm({ shopId, owner, rulesAcceptedAt, rulesAcceptedVia, termsAgreed, termsAcceptedAt }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, ...data, rulesAccepted: data.rulesAccepted === "on" }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setMsg({ type: "error", text: json?.error || "Couldn’t save" });
    form.password.value = "";
    setMsg({
      type: "ok",
      text: json.created
        ? `Login created. Share the email and password with the owner; they log in at /login.`
        : data.password
          ? "Saved, and the password was reset."
          : "Saved.",
    });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className={`${card} space-y-3`}>
      <h2 className="font-semibold">Owner login</h2>
      <p className="text-sm text-muted">
        {owner
          ? "Edit the owner’s details. Leave the password empty to keep it."
          : "Create the login the shop owner uses to see their dashboard."}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="name" defaultValue={owner?.name} placeholder="Owner name" maxLength={80} className={input} />
        <input
          name="email"
          type="email"
          required
          defaultValue={owner?.email}
          placeholder="Owner email"
          autoComplete="off"
          className={input}
        />
        <input
          name="password"
          type="text"
          required={!owner}
          minLength={8}
          placeholder={owner ? "New password (optional)" : "Password (min 8)"}
          autoComplete="new-password"
          className={input}
        />
      </div>
      {owner && (
        <p className={`text-sm ${termsAgreed ? "text-emerald-700" : "text-amber-800"}`}>
          {termsAgreed
            ? `✓ Terms of Service and Privacy Policy agreed by the owner on ${fmtDate(termsAcceptedAt)}`
            : "⚠ The owner hasn’t agreed to the Terms of Service yet. They’ll be asked on their dashboard."}
        </p>
      )}
      {rulesAcceptedAt ? (
        <p className="text-sm text-emerald-700">
          ✓ Fair-review rules agreed on {fmtDate(rulesAcceptedAt)}
          {rulesAcceptedVia === "admin" ? " (at setup)" : " (by the owner)"}
        </p>
      ) : (
        <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="mb-3 text-sm font-semibold">Go through these rules with the owner:</p>
          <FairReviewRules compact />
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" name="rulesAccepted" required={!owner} className="mt-0.5 size-4 accent-stone-900" />
            <span>The owner has read and agreed to these rules.</span>
          </label>
          {owner && (
            <p className="mt-2 text-xs text-muted">
              Not agreed yet. The owner will also be asked to agree on their dashboard.
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Saving…" : owner ? "Update owner" : "Create owner login"}
        </button>
        {msg && (
          <p className={`text-sm ${msg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>{msg.text}</p>
        )}
      </div>
    </form>
  );
}
