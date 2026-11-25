"use client";

import { useState } from "react";
import { logoutAfterPasswordChange } from "@/app/app/login/actions";
import { btnPrimary, card, inputClass as input } from "./ui";

/** Change your own password. Afterwards every device is logged out, this one too. */
export default function PasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const current = String(f.get("current") || "");
    const next = String(f.get("next") || "");
    if (next !== String(f.get("confirm") || "")) return setError("The two new passwords don’t match");
    setBusy(true);
    setError("");
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setBusy(false);
      return setError(json?.error || "Couldn’t change the password. Please try again.");
    }
    await logoutAfterPasswordChange();
  }

  const type = show ? "text" : "password";
  return (
    <form onSubmit={submit} className={`${card} space-y-4`}>
      <label className="block">
        <span className="text-sm font-medium">Current password</span>
        <input name="current" type={type} required autoComplete="current-password" className={`${input} mt-1`} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">New password</span>
        <input name="next" type={type} required minLength={8} maxLength={200} autoComplete="new-password" className={`${input} mt-1`} />
        <span className="mt-1 block text-xs text-muted">At least 8 characters. A short sentence is easy to remember and hard to guess.</span>
      </label>
      <label className="block">
        <span className="text-sm font-medium">New password again</span>
        <input name="confirm" type={type} required minLength={8} maxLength={200} autoComplete="new-password" className={`${input} mt-1`} />
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-4 accent-stone-900" />
        Show passwords
      </label>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
        {busy ? "Changing…" : "Change password"}
      </button>
      <p className="text-xs text-muted">
        For safety, you’ll be logged out on every phone and computer, including this one. Then log in with the new password.
      </p>
    </form>
  );
}
