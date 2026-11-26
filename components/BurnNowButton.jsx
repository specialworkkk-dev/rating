"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnSecondary } from "./ui";

/** Admin: run the burn now for any due days (the daily job does this at about 3 AM anyway). */
export default function BurnNowButton({ disabled }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/token/burn", { method: "POST" }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setMsg(json?.error || "Couldn’t run the burn");
    const r = json.results || [];
    setMsg(
      json.status === "blocked"
        ? "Not set up yet (see the list above)."
        : r.length === 0
          ? "Nothing to burn: every finished day is done."
          : r.map((x) => `${x.day}: ${x.status}${x.tokens ? ` (${x.tokens.toLocaleString("en-IN")} RBT)` : ""}`).join(" · ")
    );
    router.refresh();
  }

  return (
    <span className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={run} disabled={busy || disabled} className={btnSecondary}>
        {busy ? "Burning…" : "Run burn now"}
      </button>
      {msg && <span className="text-sm text-muted">{msg}</span>}
    </span>
  );
}
