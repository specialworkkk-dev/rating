"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { card, fmtDateTime } from "./ui";

const STAR_COLORS = { 5: "#16a34a", 4: "#65a30d", 3: "#f59e0b", 2: "#f97316", 1: "#ef4444" };

export default function SuspiciousPanel({ shopId, bursts }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function remove(b) {
    if (!confirm(`Remove these ${b.count} ratings (and any feedback on them)? This can’t be undone.`)) return;
    setBusy(b.ipHash + b.hour);
    setError("");
    const res = await fetch(`/api/admin/shops/${shopId}/suspicious`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ipHash: b.ipHash, hour: b.hour }),
    }).catch(() => null);
    setBusy(null);
    if (!res?.ok) return setError("Couldn’t remove them. Please try again.");
    router.refresh();
  }

  if (!bursts.length) return null;

  return (
    <section className={`${card} space-y-3 ring-amber-300`}>
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">⚠️</span>
        <h2 className="font-semibold">Unusual activity</h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
          {bursts.length}
        </span>
      </div>
      <p className="text-sm text-muted">
        Many ratings came from one network within an hour. Shop WiFi can cause this, so check before
        removing. It looks fake if the ratings are all 5★ (or all 1★) within a few minutes.
      </p>
      <ul className="divide-y divide-stone-100">
        {bursts.map((b) => (
          <li key={b.ipHash + b.hour} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
            <div className="min-w-0 flex-1 basis-60">
              <p className="font-medium">
                {b.count} ratings · avg {b.avgStars.toFixed(1)}★ · {b.devices} devices
              </p>
              <p className="text-xs text-muted">
                Network #{b.network} · {fmtDateTime(b.first)} – {fmtDateTime(b.last)}
              </p>
            </div>
            <div className="flex h-2 w-32 overflow-hidden rounded-full bg-stone-100" aria-label="Stars in this burst">
              {[5, 4, 3, 2, 1].map((s) =>
                b.breakdown[s] ? (
                  <span key={s} style={{ width: `${(b.breakdown[s] / b.count) * 100}%`, backgroundColor: STAR_COLORS[s] }} />
                ) : null
              )}
            </div>
            <button
              type="button"
              disabled={busy === b.ipHash + b.hour}
              onClick={() => remove(b)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
            >
              {busy === b.ipHash + b.hour ? "Removing…" : "Remove"}
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
