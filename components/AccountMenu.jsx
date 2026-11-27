"use client";

import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/app/login/actions";

function initials(name, email) {
  const src = (name || "").trim() || (email || "").split("@")[0];
  const parts = src.split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : src.slice(0, 2)).toUpperCase();
}

/** Avatar button with a dropdown: who is logged in, their role, and Log out. */
export default function AccountMenu({ name, email, role }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const display = name?.trim() || email.split("@")[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors outline-none hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-brand-500/60"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
          {initials(name, email)}
        </span>
        <span className="hidden max-w-36 truncate text-sm font-medium md:block">{display}</span>
        <svg viewBox="0 0 20 20" className={`size-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-stone-200"
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
              {initials(name, email)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{display}</p>
              <p className="truncate text-sm text-muted">{email}</p>
            </div>
          </div>
          <div className="px-4 pb-3">
            <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
              {role === "admin" ? "Administrator" : "Shop owner"}
            </span>
          </div>
          <div className="border-t border-stone-100 p-1.5">
            <a
              href={role === "admin" ? "/app/admin/password" : "/app/dashboard/password"}
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-stone-50"
            >
              <span aria-hidden="true">🔑</span> Change password
            </a>
          </div>
          <div className="flex gap-4 border-t border-stone-100 px-4 py-2.5 text-xs text-muted">
            <a href="/terms" target="_blank" className="hover:text-ink hover:underline">
              Terms of Service
            </a>
            <a href="/privacy" target="_blank" className="hover:text-ink hover:underline">
              Privacy Policy
            </a>
          </div>
          <form
            action={logout}
            onSubmit={() => {
              // Forget saved app pages on this phone (public/sw.js).
              try {
                caches?.delete("rb-pages-v1");
                navigator.serviceWorker?.controller?.postMessage({ type: "rb-clear" });
              } catch {}
            }}
            className="border-t border-stone-100 p-1.5"
          >
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path
                  d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
