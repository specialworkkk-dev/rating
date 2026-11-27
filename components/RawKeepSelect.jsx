"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Admin → Services: keep raw records (each rating, scan, Google tap) for 2 or 3 months. */
export default function RawKeepSelect({ months, changed }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function choose(m) {
    if (m === months) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/settings/raw-keep", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ months: m }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError("Couldn’t save");
    router.refresh();
  }

  return (
    <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-stone-200">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-ink">Keep raw records for</span>
        <div className="flex rounded-lg bg-stone-100 p-1" role="radiogroup" aria-label="Keep raw records for">
          {[2, 3].map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={months === m}
              disabled={busy}
              onClick={() => choose(m)}
              className={`rounded-md px-3 py-1 text-sm ${months === m ? "bg-white font-semibold shadow-sm" : "text-stone-600"}`}
            >
              {m} months
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        Each rating, scan and Google tap is deleted after this, at the nightly cleanup. Owners never see these records: their totals,
        charts and tables are kept forever. 2 months uses about a third less space.
        {changed ? ` Changed ${changed}.` : ""}
      </p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
