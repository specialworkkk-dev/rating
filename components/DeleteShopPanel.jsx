"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtNum } from "@/lib/format";
import { btnSecondary, card } from "./ui";

/** Admin: download a copy of a shop's data, then delete the shop and everything stored for it. */
export default function DeleteShopPanel({ shop, counts }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const matches = typed.trim().toLowerCase() === shop.slug;

  async function remove(e) {
    e.preventDefault();
    if (!matches || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/shops/${shop.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: typed }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setBusy(false);
      return setError(json?.error || "Couldn’t delete. Please try again.");
    }
    router.replace(`/app/admin?deleted=${encodeURIComponent(json.name)}`);
    router.refresh();
  }

  const items = [
    ["ratings", counts.ratings],
    ["feedback messages, with any names and phone numbers", counts.feedback],
    ["scans and Google taps", counts.scans],
  ];

  return (
    <section className={`${card} space-y-4 ring-2 ring-red-200`}>
      <div>
        <h2 className="font-semibold text-red-700">Danger zone: delete this shop</h2>
        <p className="mt-1 text-sm text-muted">
          Removes the shop and everything stored for it, for good. Use it when a shop leaves, or within 90 days of it closing, as
          our Privacy Policy promises.
        </p>
      </div>

      <div className="rounded-xl bg-stone-50 p-4 text-sm">
        <p className="font-medium">1. Download a copy first (if the owner wants one)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href={`/api/admin/shops/${shop.id}/export?what=feedback`} className={btnSecondary} download>
            ⬇ Feedback ({fmtNum(counts.feedback)})
          </a>
          <a href={`/api/admin/shops/${shop.id}/export?what=figures`} className={btnSecondary} download>
            ⬇ Monthly figures
          </a>
        </div>
        <p className="mt-2 text-xs text-muted">Spreadsheet files (CSV) that open in Excel or Google Sheets.</p>
      </div>

      <form onSubmit={remove} className="space-y-3 rounded-xl bg-red-50 p-4 text-sm ring-1 ring-red-200">
        <p className="font-medium">2. Delete</p>
        <ul className="list-disc space-y-0.5 pl-5 text-stone-700">
          <li>
            the shop <b>{shop.name}</b> and its rating page (QR posters will show “not found”)
          </li>
          {items.map(([label, n]) => (
            <li key={label}>
              {fmtNum(n)} {label}
            </li>
          ))}
          <li>all its daily, monthly and all-time figures</li>
          <li>{shop.owner ? `the owner’s login (${shop.owner.email})` : "no owner login to remove"}</li>
        </ul>
        <label className="block">
          <span className="font-medium text-red-800">
            This cannot be undone. Type <span className="rounded bg-white px-1.5 py-0.5 font-mono">{shop.slug}</span> to confirm:
          </span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={shop.slug}
            className="mt-2 w-full max-w-sm rounded-lg border border-red-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </label>
        {error && (
          <p className="text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!matches || busy}
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-40"
        >
          {busy ? "Deleting…" : "Delete shop and all its data"}
        </button>
      </form>
    </section>
  );
}
