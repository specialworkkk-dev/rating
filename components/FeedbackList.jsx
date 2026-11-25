"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { fmtFull, fmtNum, fmtRelative, whatsappLink } from "@/lib/format";
import FeedbackCleanup from "./FeedbackCleanup";
import { InboxIllustration } from "./illustrations";
import Pagination from "./Pagination";

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

const PHONE = "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z";
const CHAT = "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z";
const TRASH = "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6";
const CHECK = "M20 6L9 17l-5-5";
const MAIL = "M4 6h16v12H4zM4 7l8 6 8-6";

function Icon({ d, className = "size-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function Avatar({ f }) {
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
      {initials(f.name || "")}
      {!f.isRead && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-red-600 ring-2 ring-white" aria-label="Unread" />}
    </span>
  );
}

function StarBadge({ stars }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ${STAR_BADGE[stars] || STAR_BADGE[3]}`}>
      {stars}★ {STAR_LABEL[stars]}
    </span>
  );
}

function Contact({ phone }) {
  if (!phone) return <span className="text-xs text-stone-400">No phone</span>;
  const wa = whatsappLink(phone);
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
      <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 font-medium text-stone-600 hover:text-ink">
        <Icon d={PHONE} className="size-3" /> {phone}
      </a>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-900">
          <Icon d={CHAT} className="size-3" /> WhatsApp
        </a>
      )}
    </span>
  );
}

/** The message: two lines, "Show more" for the rest; same-day follow-ups marked. */
function MessageText({ text }) {
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef(null);
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  // Offer "Show more" whenever the two-line preview is actually cut off on
  // this screen size (not by a fixed character count).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, open]);

  const long = parts.length > 1 || clamped;

  return (
    <div className="min-w-0">
      {open ? (
        <div className="space-y-2">
          {parts.map((p, i) => (
            <div key={i}>
              {i > 0 && <p className="text-[11px] font-medium tracking-wide text-muted uppercase">Added later</p>}
              <p className="leading-relaxed break-words whitespace-pre-wrap">{p}</p>
            </div>
          ))}
        </div>
      ) : (
        <p ref={ref} className="line-clamp-2 leading-relaxed break-words">
          {parts.join(" · ")}
        </p>
      )}
      {long && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 text-xs font-semibold text-brand-700 hover:underline">
          {open ? "Show less" : parts.length > 1 ? `Show all ${parts.length} messages` : "Show more"}
        </button>
      )}
    </div>
  );
}

function Received({ at }) {
  return (
    <time dateTime={at} title={fmtFull(at)} className="block whitespace-nowrap">
      <span className="block">{fmtRelative(at)}</span>
      <span className="block text-xs text-muted">{fmtFull(at)}</span>
    </time>
  );
}

/** Mark read/unread and delete (with a confirm step). */
function Actions({ f, onToggleRead, onDelete, compact = false }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className="text-muted">Delete?</span>
        <button type="button" onClick={() => onDelete(f)} className="rounded-lg bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-700">
          Yes
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-2 py-1 font-medium text-stone-600 hover:bg-stone-100">
          No
        </button>
      </span>
    );
  }
  const btn = "inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors";
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => onToggleRead(f)}
        title={f.isRead ? "Mark as unread" : "Mark as read"}
        aria-label={f.isRead ? "Mark as unread" : "Mark as read"}
        className={`${btn} px-2 py-1.5 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50 hover:text-ink`}
      >
        <Icon d={f.isRead ? MAIL : CHECK} className="size-4" />
        {compact && <span>{f.isRead ? "Mark unread" : "Mark read"}</span>}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title="Delete"
        aria-label="Delete message"
        className={`${btn} px-2 py-1.5 text-stone-500 hover:bg-red-50 hover:text-red-700`}
      >
        <Icon d={TRASH} className="size-4" />
        {compact && <span>Delete</span>}
      </button>
    </span>
  );
}

const STAR_FILL = { 1: "#c23434", 2: "#e66767", 3: "#aeaba4" };
const AVATAR_TONE = {
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-amber-100 text-amber-800",
};

function StarRow({ stars }) {
  return (
    <span className="inline-flex gap-px" aria-label={`${stars} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
          <path
            d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z"
            fill={i <= stars ? STAR_FILL[stars] || STAR_FILL[3] : "#e7e5e4"}
          />
        </svg>
      ))}
    </span>
  );
}

/** Phone layout: one roomy card per message with big, thumb-friendly buttons. */
function PhoneCard({ f, onToggleRead, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const wa = whatsappLink(f.phone);
  const tel = f.phone ? `tel:${f.phone.replace(/[^\d+]/g, "")}` : null;
  const btn =
    "flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold ring-1 transition-colors active:scale-[0.98]";

  return (
    <li
      className={`relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ${
        f.isRead ? "ring-stone-200" : "ring-amber-300"
      }`}
    >
      {!f.isRead && <span className="absolute inset-y-0 left-0 w-1 bg-amber-400" aria-hidden="true" />}

      <div className="flex items-start gap-3">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${AVATAR_TONE[f.stars] || AVATAR_TONE[3]}`}>
          {initials(f.name || "")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`min-w-0 flex-1 text-base leading-snug break-words ${f.isRead ? "font-medium text-stone-700" : "font-bold text-ink"}`}>
              {f.name || "Anonymous customer"}
            </p>
            {!f.isRead && (
              <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase">New</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-sm">
            <span className="flex items-center gap-1.5">
              <StarRow stars={f.stars} />
              <span className="font-medium text-stone-700">{STAR_LABEL[f.stars]}</span>
            </span>
            <time dateTime={f.createdAt} title={fmtFull(f.createdAt)} className="text-muted">
              {fmtRelative(f.createdAt)}
            </time>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl rounded-tl-md bg-stone-50 px-4 py-3 text-[15px] leading-relaxed text-ink">
        <MessageText text={f.message} />
      </div>

      {f.phone && <p className="mt-3 text-sm text-muted">Phone: <span className="font-medium text-ink tabular-nums">{f.phone}</span></p>}

      {confirming ? (
        <div className="mt-3 rounded-xl bg-red-50 p-3 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-800">Delete this message for good?</p>
          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => setConfirming(false)} className={`${btn} bg-white text-stone-700 ring-stone-300`}>
              Cancel
            </button>
            <button type="button" onClick={() => onDelete(f)} className={`${btn} bg-red-600 text-white ring-red-600`}>
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          {tel && (
            <a href={tel} className={`${btn} bg-white text-stone-800 ring-stone-300`}>
              <Icon d={PHONE} className="size-4" /> Call
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn} bg-emerald-600 text-white ring-emerald-600`}>
              <Icon d={CHAT} className="size-4" /> WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={() => onToggleRead(f)}
            aria-label={f.isRead ? "Mark as unread" : "Mark as read"}
            className={`${btn} bg-white text-stone-800 ring-stone-300 ${tel ? "w-11 flex-none" : ""}`}
          >
            <Icon d={f.isRead ? MAIL : CHECK} className="size-4" />
            <span className={tel ? "sr-only" : ""}>{f.isRead ? "Mark unread" : "Mark read"}</span>
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Delete message"
            className={`${btn} w-11 flex-none bg-white text-red-600 ring-stone-300`}
          >
            <Icon d={TRASH} className="size-4" />
          </button>
        </div>
      )}
    </li>
  );
}

/** Private complaints inbox: a table on tablet/desktop, cards on phones. */
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
    router.refresh(); // header badges
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
    if (data.items.length === 1 && page > 1) setPage((p) => p - 1);
    else reload();
  }

  const filtered = status !== "all" || stars || q.trim();
  const { items, counts } = data;

  return (
    <section
      ref={top}
      className="scroll-mt-28 md:overflow-hidden md:rounded-2xl md:bg-white md:shadow-sm md:ring-1 md:ring-stone-200"
    >
      {/* Toolbar */}
      <div className="space-y-3 md:space-y-4 md:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold">Inbox</h2>
          {counts.unread > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{fmtNum(counts.unread)} new</span>}
          <span className="text-sm text-muted">{fmtNum(counts.all)} total</span>
          {counts.all > 0 && (
            <button
              type="button"
              onClick={() => setCleanup((v) => !v)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50 hover:text-ink"
              aria-expanded={cleanup}
            >
              <Icon d={TRASH} className="size-3.5" />
              <span className="md:hidden">Clean up</span>
              <span className="hidden md:inline">Clean up old messages</span>
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
          <p className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-200" role="status">
            {notice}
            <button type="button" onClick={() => setNotice("")} className="text-emerald-700 hover:text-emerald-900" aria-label="Dismiss">
              ✕
            </button>
          </p>
        )}

        {counts.all > 0 && (
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 md:pb-0">
            <div className="flex shrink-0 rounded-xl bg-stone-200/60 p-1 text-sm md:bg-stone-100" role="tablist" aria-label="Status">
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

            <label className="relative shrink-0">
              <span className="sr-only">Filter by stars</span>
              <select
                value={stars ?? ""}
                onChange={(e) => changeFilter(() => setStars(e.target.value ? Number(e.target.value) : null))}
                className={`h-full min-h-10 appearance-none rounded-xl py-2 pr-9 pl-3.5 text-sm outline-none focus:ring-4 focus:ring-stone-900/10 ${
                  stars ? "bg-white font-medium text-ink ring-2 ring-stone-900" : "bg-stone-200/60 text-stone-700 md:bg-stone-100"
                }`}
              >
                <option value="">All stars</option>
                <option value="1">1★ Terrible</option>
                <option value="2">2★ Bad</option>
                <option value="3">3★ Okay</option>
              </select>
              <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-stone-500" aria-hidden="true">
                <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </label>
            </div>

            <label className="relative order-first w-full md:order-none md:ml-auto md:w-64">
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

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className={`transition-opacity ${loading ? "opacity-50" : ""}`} aria-busy={loading}>
        {items.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-2xl bg-white px-4 pt-6 pb-8 text-center ring-1 ring-stone-200 md:mt-0 md:rounded-none md:border-t md:border-stone-100 md:ring-0">
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
          <>
            {/* Tablet and desktop: a real table */}
            <div className="hidden overflow-x-auto border-t border-stone-200 md:block">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[30%] lg:w-[26%]" />
                  <col className="w-28" />
                  <col />
                  <col className="w-36" />
                  <col className="w-24" />
                </colgroup>
                <thead className="bg-stone-50 text-left text-xs font-medium text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Customer</th>
                    <th className="px-3 py-2.5 font-medium">Rating</th>
                    <th className="px-3 py-2.5 font-medium">Message</th>
                    <th className="px-3 py-2.5 font-medium">Received</th>
                    <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((f) => (
                    <tr key={f.id} className={`align-top ${f.isRead ? "" : "bg-amber-50/50"}`}>
                      <td className="relative px-4 py-3.5">
                        {!f.isRead && <span className="absolute inset-y-0 left-0 w-1 bg-amber-400" aria-hidden="true" />}
                        <div className="flex items-start gap-3">
                          <Avatar f={f} />
                          <div className="min-w-0 space-y-1">
                            <p className={`truncate ${f.isRead ? "font-medium" : "font-semibold"}`}>{f.name || "Anonymous customer"}</p>
                            <Contact phone={f.phone} />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <StarBadge stars={f.stars} />
                      </td>
                      <td className="px-3 py-3.5 text-ink">
                        <MessageText text={f.message} />
                      </td>
                      <td className="px-3 py-3.5 text-sm">
                        <Received at={f.createdAt} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Actions f={f} onToggleRead={toggleRead} onDelete={remove} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phones: one roomy card per message */}
            <ul className="mt-4 space-y-3 md:hidden">
              {items.map((f) => (
                <PhoneCard key={f.id} f={f} onToggleRead={toggleRead} onDelete={remove} />
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="pt-4 md:p-5">
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
