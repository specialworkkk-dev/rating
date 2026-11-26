"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const STATUSES = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "trial", label: "Trial" },
  { key: "due", label: "Due" },
  { key: "paused", label: "Paused" },
];

const SORTS = [
  { key: "new", label: "Newest first" },
  { key: "name", label: "Name A–Z" },
  { key: "price", label: "Highest price" },
  { key: "activity", label: "Most ratings (30 days)" },
];

/** Search, status and sort for the admin shop list, kept in the URL. */
export default function AdminShopFilters({ counts }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") || "");
  const status = params.get("status") || "all";
  const sort = params.get("sort") || "new";

  const push = (changes) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (!v || (k === "status" && v === "all") || (k === "sort" && v === "new")) next.delete(k);
      else next.set(k, v);
    }
    next.delete("page"); // any filter change starts at page 1
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  // Search as you type, after a short pause.
  useEffect(() => {
    if (q === (params.get("q") || "")) return;
    const t = setTimeout(() => push({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className={`flex flex-wrap items-center gap-2 transition-opacity ${pending ? "opacity-60" : ""}`}>
      {/* One row on phones too: the tabs share the width instead of wrapping. */}
      <div className="flex w-full rounded-xl bg-stone-200/60 p-1 text-sm sm:w-auto" role="tablist" aria-label="Status">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={status === s.key}
            onClick={() => push({ status: s.key })}
            className={`flex flex-1 items-center justify-center rounded-lg px-1.5 py-1.5 whitespace-nowrap sm:flex-none sm:px-3 ${
              status === s.key ? "bg-white font-medium shadow-sm" : "text-stone-600 hover:text-ink"
            }`}
          >
            {s.label}
            <span className={`ml-1 text-xs tabular-nums sm:ml-1.5 ${s.key === "due" && counts.due ? "font-semibold text-red-600" : "text-muted"}`}>
              {counts[s.key]}
            </span>
          </button>
        ))}
      </div>

      <label className="relative w-full sm:ml-auto sm:w-64">
        <span className="sr-only">Search shops</span>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true">
          <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or phone"
          className="w-full rounded-xl border border-stone-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5"
        />
      </label>

      <label className="flex w-full items-center gap-2 text-sm text-muted sm:w-auto">
        Sort
        <select
          value={sort}
          onChange={(e) => push({ sort: e.target.value })}
          className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-stone-900 sm:flex-none"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
