"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InboxIllustration } from "./illustrations";
import { card, fmtDateTime } from "./ui";

const STAR_BADGE = {
  1: "bg-red-50 text-red-700 ring-red-200",
  2: "bg-orange-50 text-orange-700 ring-orange-200",
  3: "bg-amber-50 text-amber-800 ring-amber-200",
};

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function FeedbackList({ initial }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  async function setRead(id, isRead) {
    setError("");
    setItems((xs) => xs.map((f) => (f.id === id ? { ...f, isRead } : f)));
    const res = await fetch(`/api/dashboard/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead }),
    }).catch(() => null);
    if (!res?.ok) {
      setItems((xs) => xs.map((f) => (f.id === id ? { ...f, isRead: !isRead } : f)));
      setError("Couldn’t update. Check your connection and try again.");
      return;
    }
    router.refresh(); // updates the unread badge
  }

  const unread = items.filter((f) => !f.isRead).length;
  const shown = filter === "unread" ? items.filter((f) => !f.isRead) : items;

  return (
    <section id="feedback" className={`${card} scroll-mt-20`}>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-semibold">Private feedback</h2>
        {unread > 0 && (
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            {unread} new
          </span>
        )}
        <div className="ml-auto flex rounded-lg bg-stone-100 p-1 text-sm">
          {["all", "unread"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 capitalize ${filter === f ? "bg-white font-medium shadow-sm" : "text-stone-600"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {shown.length === 0 ? (
        <div className="mt-6 mb-2 flex flex-col items-center text-center">
          <InboxIllustration />
          <p className="mt-3 font-medium">
            {filter === "unread" ? "All caught up" : "No complaints yet"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {filter === "unread"
              ? "You’ve read all your feedback."
              : "When a customer rates 1–3★ and writes to you, it shows up here."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-stone-100">
          {shown.map((f) => (
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
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STAR_BADGE[f.stars] || STAR_BADGE[3]}`}
                    >
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
    </section>
  );
}
