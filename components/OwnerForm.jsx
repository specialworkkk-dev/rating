"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnPrimary, card, smallInputClass as input } from "./ui";

export default function OwnerForm({ shopId, owner }) {
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
      body: JSON.stringify({ shopId, ...data }),
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
