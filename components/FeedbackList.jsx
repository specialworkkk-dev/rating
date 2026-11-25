"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { fmtFull, fmtNum, fmtRelative, whatsappLink } from "@/lib/format";
import FeedbackCleanup from "./FeedbackCleanup";
import { InboxIllustration } from "./illustrations";
import Pagination from "./Pagination";
import { card } from "./ui";

const STAR_BADGE = {
  1: "bg-red-50 text-red-700 ring-red-200",
  2: "bg-orange-50 text-orange-700 ring-orange-200",
  3: "bg-amber-50 text-amber-800 ring-amber-200",
};
const STAR_LABEL = { 1: "Terrible", 2: "Bad", 3: "Okay" };

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

function Icon({ d, className = "size-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const PHONE = "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z";
const CHAT = "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z";
const TRASH = "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6";
const CHECK = "M20 6L9 17l-5-5";

/** One complaint, laid out to be read quickly and answered. */
function Message({ f, onToggleRead, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const parts = f.message.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const wa = whatsappLink(f.phone);

  return (
    <li className={`relative rounded-2xl p-4 transition-colors sm:p-5 ${f.isRead ? "" : "bg-amber-50/50 ring-1 ring-amber-100"}`}>
      <div className="flex items-start gap-3">
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-600">
          {initials(f.name || "")}
          {!f.isRead && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-red-600 ring-2 ring-white" aria-label="Unread" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{f.name || "Anonymous customer"}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STAR_BADGE[f.stars] || STAR_BADGE[3]}`}>
              {f.stars}★ {STAR_LABEL[f.stars]}
            </span>
            <time dateTime={f.createdAt} title={fmtFull(f.createdAt)} className="text-sm text-muted">
              · {fmtRelative(f.createdAt)}
            </time>
          </div>

          {f.phone && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a
                href={`tel:${f.phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
              >
                <Icon d={PHONE} className="size-3.5" /> {f.phone}
              </a>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
                >
                  <Icon d={CHAT} className="size-3.5" /> WhatsApp
                </a>
              )}
            </div>
          )}

          {/* The message itself: a speech bubble; same-day follow-ups shown separately. */}
          <div className="mt-3 space-y-2">
            {parts.map((p, i) => (
              <div key={i}>
                {i > 0 && <p className="mb-1 text-xs font-medium tracking-wide text-muted uppercase">Added later</p>}
                <p className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-ink ring-1 ring-stone-200">
                  {p}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleRead(f)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-600 ring-1 ring-stone-200 hover:bg-white hover:text-ink"
            >
              <Icon d={CHECK} className="size-3.5" />
              {f.isRead ? "Mark as unread" : "Mark as read"}
            </button>
            {confirming ? (
              <span className="inline-flex items-center gap-2 text-sm">
                <span className="text-muted">Delete this message for good?</span>
                <button type="button" onClick={() => onDelete(f)} className="rounded-lg bg-red-600 px-2.5 py-1.5 font-semibold text-white hover:bg-red-700">
                  Delete
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="px-1.5 py-1.5 font-medium text-stone-600 hover:text-ink">
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-500 hover:bg-red-50 hover:text-red-700"
              >
                <Icon d={TRASH} className="size-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/** Private complaints inbox: filters, page sizes, delete and clean-up. */
export default function FeedbackList({ initial }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState("all");
  const [stars, setStars] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(initial.pageSize || 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cleanup, setCleanup] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const first = useRef(true);
  const top = useRef(null);

  const load = useCallback(async (opts) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ status: opts.status, page: String(opts.page), per: String(opts.per) });
    if (opts.stars) params.set("stars", String(opts.stars));
    if (opts.q.trim()) params.set("q", opts.q.trim());
    const res = await fetch(`/api/dashboard/feedback?${params}`).catch(() => null);
    const json = res?.ok ? await res.json().catch(() => null) : null;
    setLoading(false);
    if (!json) return setError("Couldn’t load messages. Check your connection and try again.");
    setData(json);
  }, []);

  // Reload when filters, page or page size change (search waits for a pause in typing).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => load({ status, stars, q, page, per }), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [status, stars, q, page, per, reloadKey, load]);

  const changeFilter = (fn) => {
    fn();
    setPage(1);
  };
  const reload = () => {
    setReloadKey((k) => k + 1);
    router.refresh(); // header bell and banner
  };

  async function toggleRead(f) {
    const isRead = !f.isRead;
    setError("");
    setData((d) => ({ ...d, items: d.items.map((x) => (x.id === f.id ? { ...x, isRead } : x)) }));
    const res = await fetch(`/api/dashboard/feedback/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead }),
    }).catch(() => null);
    if (!res?.ok) {
      setData((d) => ({ ...d, items: d.items.map((x) => (x.id === f.id ? { ...x, isRead: !isRead } : x)) }));
      return setError("Couldn’t update. Check your connection and try again.");
    }
    setData((d) => ({ ...d, counts: { ...d.counts, unread: d.counts.unread + (isRead ? -1 : 1) } }));
    router.refresh();
  }

  async function remove(f) {
    setError("");
    const res = await fetch(`/api/dashboard/feedback/${f.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setError("Couldn’t delete. Check your connection and try again.");
    setNotice("Message deleted.");
    // If that was the last one on this page, step back a page.
    if (data.items.length === 1 && page > 1) setPage((p) => p - 1);
    else reload();
  }

  const filtered = status !== "all" || stars || q.trim();
  const { items, counts } = data;

  return (
    <section id="feedback" ref={top} className={`${card} scroll-mt-20`}>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-semibold">Private feedback</h2>
        {counts.unread > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{fmtNum(counts.unread)} new</span>}
        <span className="text-sm text-muted">{fmtNum(counts.all)} total</span>
        {counts.all > 0 && (
          <button
            type="button"
            onClick={() => setCleanup((v) => !v)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50 hover:text-ink"
            aria-expanded={cleanup}
          >
            <Icon d={TRASH} className="size-3.5" /> Clean up old messages
          </button>
        )}
      </div>

      {cleanup && (
        <FeedbackCleanup
          onClose={() => setCleanup(false)}
          onDeleted={(n) => {
            setCleanup(false);
            setNotice(`${fmtNum(n)} old ${n === 1 ? "message" : "messages"} deleted.`);
            setPage(1);
            reload();
          }}
        />
      )}

      {notice && (
        <p className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-200" role="status">
          {notice}
          <button type="button" onClick={() => setNotice("")} className="text-emerald-700 hover:text-emerald-900" aria-label="Dismiss">
            ✕
          </button>
        </p>
      )}

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
                  <span className="ml-1.5 rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-700">{fmtNum(counts.unread)}</span>
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
          <ul className="mt-4 space-y-3">
            {items.map((f) => (
              <Message key={f.id} f={f} onToggleRead={toggleRead} onDelete={remove} />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <Pagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          pageSize={per}
          noun={data.total === 1 ? "message" : "messages"}
          onChange={(n) => {
            setPage(n);
            top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onPageSizeChange={(n) => {
            setPer(n);
            setPage(1);
          }}
        />
      </div>
    </section>
  );
}
