"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const PAGE_SIZES = [5, 10, 15, 25];

/**
 * "Show [10] per page". With `onChange` (client lists) it calls back; without
 * it (server pages) it sets ?per= in the URL and goes back to page 1.
 */
export default function PageSizeSelect({ value, onChange }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const change = (n) => {
    if (onChange) return onChange(n);
    const next = new URLSearchParams(params);
    if (n === 10) next.delete("per");
    else next.set("per", String(n));
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Show
      <select
        value={value}
        onChange={(e) => change(Number(e.target.value))}
        className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm text-ink tabular-nums outline-none focus:border-stone-900"
        aria-label="Items per page"
      >
        {PAGE_SIZES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      per page
    </label>
  );
}
