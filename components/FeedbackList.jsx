"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { InboxIllustration } from "./illustrations";
import Pagination from "./Pagination";
import { card, fmtDateTime } from "./ui";

const STAR_BADGE = {
  1: "bg-red-50 text-red-700 ring-red-200",
  2: "bg-orange-50 text-orange-700 ring-orange-200",
  3: "bg-amber-50 text-amber-800 ring-amber-200",
};

const STATUSES = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
];

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/** Private complaints inbox: status / stars / search filters, 10 per page. */
export default function FeedbackList({ initial }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState("all");
  const [stars, setStars] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const first = useRef(true);
  const top = useRef(null);

  const load = useCallback(async (opts) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ status: opts.status, page: String(opts.page) });
    if (opts.stars) params.set("stars", String(opts.stars));
    if (opts.q.trim()) params.set("q", opts.q.trim());
    const res = await fetch(`/api/dashboard/feedback?${params}`).catch(() => null);
    const json = res?.ok ? await res.json().catch(() => null) : null;
    setLoading(false);
    if (!json) return setError("Couldn’t load messages. Check your connection and try again.");
    setData(json);
  }, []);

  // Reload when filters or page change (search waits until typing pauses).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => load({ status, stars, q, page }), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [status, stars, q, page, load]);

  const changeFilter = (fn) => {
    fn();
    setPage(1);
  };

  async function setRead(id, isRead) {
    setError("");
    setData((d) => ({ ...d, items: d.items.map((f) => (f.id === id ? { ...f, isRead } : f)) }));
    const res = await fetch(`/api/dashboard/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead }),
    }).catch(() => null);
    if (!res?.ok) {
      setData((d) => ({ ...d, items: d.items.map((f) => (f.id === id ? { ...f, isRead: !isRead } : f)) }));
      setError("Couldn’t update. Check your connection and try again.");
      return;
    }
    setData((d) => ({ ...d, counts: { ...d.counts, unread: d.counts.unread + (isRead ? -1 : 1) } }));
    router.refresh(); // updates the bell badge in the header
  }

  const filtered = status !== "all" || stars || q.trim();
  const { items, counts } = data;

  return (
    <section id="feedback" ref={top} className={`${card} scroll-mt-20`}>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-semibold">Private feedback</h2>
        {counts.unread > 0 && (
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{counts.unread} new</span>
        )}
        <span className="text-sm text-muted">{counts.all} total</span>
      </div>

      {counts.all > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-stone-100 p-1 text-sm" role="tablist" aria-label="Status">
            {STATUSES.map((s) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={status === s.key}
                onClick={() => changeFilter(() => setStatus(s.key))}
                className={`rounded-lg px-3 py-1.5 ${status === s.key ? "bg-white font-medium shadow-sm" : "text-stone-600 hover:text-ink"}`}
              >
                {s.label}
                {s.key === "unread" && counts.unread > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-700">{counts.unread}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex rounded-xl bg-stone-100 p-1 text-sm" role="group" aria-label="Stars">
            {[null, 1, 2, 3].map((s) => (
              <button
                key={s ?? "any"}
                type="button"
                aria-pressed={stars === s}
                onClick={() => changeFilter(() => setStars(s))}
                className={`rounded-lg px-2.5 py-1.5 tabular-nums ${stars === s ? "bg-white font-medium shadow-sm" : "text-stone-600 hover:text-ink"}`}
              >
                {s ? `${s}★` : "All stars"}
              </button>
            ))}
          </div>

          <label className="relative ml-auto w-full sm:w-60">
            <span className="sr-only">Search messages</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true">
              <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => changeFilter(() => setQ(e.target.value))}
              placeholder="Search messages"
              className="w-full rounded-xl border border-stone-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5"
            />
          </label>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className={`transition-opacity ${loading ? "opacity-50" : ""}`} aria-busy={loading}>
        {items.length === 0 ? (
          <div className="mt-6 mb-2 flex flex-col items-center text-center">
            <InboxIllustration />
            {filtered ? (
              <>
                <p className="mt-3 font-medium">No messages match these filters</p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("all");
                    setStars(null);
                    setQ("");
                    setPage(1);
                  }}
                  className="mt-2 text-sm font-medium text-brand-700 underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="mt-3 font-medium">No complaints yet</p>
                <p className="mt-1 text-sm text-muted">When a customer rates 1–3★ and writes to you, it shows up here.</p>
              </>
            )}
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100">
            {items.map((f) => (
              <li key={f.id} className={`flex gap-3 py-4 ${f.isRead ? "opacity-70" : ""}`}>
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-600">
                  {initials(f.name || "")}
                  {!f.isRead && (
                    <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-red-600 ring-2 ring-white" aria-label="Unread" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate font-medium">{f.name || "Anonymous"}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STAR_BADGE[f.stars] || STAR_BADGE[3]}`}>
                        {f.stars}★
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRead(f.id, !f.isRead)}
                      className="ml-auto shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50 hover:text-ink sm:text-sm"
                    >
                      {f.isRead ? "Mark unread" : "Mark as read"}
                    </button>
                  </div>
                  <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted sm:text-sm">
                    {f.phone && (
                      <>
                        <a href={`tel:${f.phone.replace(/[^\d+]/g, "")}`} className="font-medium text-brand-700 underline">
                          {f.phone}
                        </a>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span>{fmtDateTime(f.createdAt)}</span>
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{f.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Pagination
        page={data.page}
        pages={data.pages}
        total={data.total}
        pageSize={data.pageSize}
        noun={data.total === 1 ? "message" : "messages"}
        onChange={(n) => {
          setPage(n);
          top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    </section>
  );
}
