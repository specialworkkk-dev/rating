"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { card, fmtDateTime } from "./ui";

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
    <section className={card}>
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
        <p className="mt-6 mb-2 text-center text-sm text-muted">
          {filter === "unread" ? "All caught up. No unread feedback." : "No feedback yet."}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-100">
          {shown.map((f) => (
            <li key={f.id} className={`py-4 ${f.isRead ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {!f.isRead && <span className="size-2 rounded-full bg-red-600" aria-label="Unread" />}
                <span className="font-semibold text-red-600">{f.stars}★</span>
                <span className="font-medium">{f.name || "Anonymous"}</span>
                {f.phone && (
                  <a href={`tel:${f.phone.replace(/[^\d+]/g, "")}`} className="text-brand-700 underline">
                    {f.phone}
                  </a>
                )}
                <span className="text-muted">{fmtDateTime(f.createdAt)}</span>
                <button
                  type="button"
                  onClick={() => setRead(f.id, !f.isRead)}
                  className="ml-auto text-sm font-medium text-stone-600 hover:text-ink"
                >
                  {f.isRead ? "Mark unread" : "Mark as read"}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[15px]">{f.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
