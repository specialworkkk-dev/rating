import Link from "next/link";

/** Page numbers to show: first, last, current ±1, with gaps as null. */
function pageList(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((n, i) => {
    if (i && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}

/**
 * Works in both worlds: pass `hrefFor(page)` for links (server pages) or
 * `onChange(page)` for buttons (client components).
 */
export default function Pagination({ page, pages, total, pageSize, hrefFor, onChange, noun = "items" }) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const item = (n, label, { disabled = false, current = false, aria } = {}) => {
    const cls = `flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm tabular-nums transition-colors ${
      current
        ? "bg-stone-900 font-semibold text-white"
        : disabled
          ? "cursor-not-allowed text-stone-300"
          : "text-stone-600 hover:bg-stone-100 hover:text-ink"
    }`;
    if (disabled || current) {
      return (
        <span key={`${label}-${n}`} className={cls} aria-current={current ? "page" : undefined} aria-label={aria}>
          {label}
        </span>
      );
    }
    return hrefFor ? (
      <Link key={`${label}-${n}`} href={hrefFor(n)} scroll={false} className={cls} aria-label={aria}>
        {label}
      </Link>
    ) : (
      <button key={`${label}-${n}`} type="button" onClick={() => onChange(n)} className={cls} aria-label={aria}>
        {label}
      </button>
    );
  };

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4" aria-label="Pagination">
      <p className="text-sm text-muted">
        Showing <span className="font-medium text-ink tabular-nums">{from}–{to}</span> of{" "}
        <span className="font-medium text-ink tabular-nums">{total}</span> {noun}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          {item(page - 1, "‹ Prev", { disabled: page <= 1, aria: "Previous page" })}
          <span className="hidden items-center gap-1 sm:flex">
            {pageList(page, pages).map((n, i) =>
              n === null ? (
                <span key={`gap-${i}`} className="px-1 text-stone-400">
                  …
                </span>
              ) : (
                item(n, n, { current: n === page, aria: `Page ${n}` })
              )
            )}
          </span>
          <span className="px-2 text-sm text-muted tabular-nums sm:hidden">
            {page} / {pages}
          </span>
          {item(page + 1, "Next ›", { disabled: page >= pages, aria: "Next page" })}
        </div>
      )}
    </nav>
  );
}
