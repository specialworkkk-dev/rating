"use client";

import { useActionState, useEffect, useState } from "react";
import { login } from "./actions";

const field =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  const [show, setShow] = useState(false);

  // Forget any app pages saved on this phone (public/sw.js), so the next
  // account never sees the previous one's screens.
  useEffect(() => {
    try {
      caches?.delete("rb-pages-v1");
    } catch {}
  }, []);

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={`${field} mt-1.5`}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <span className="relative mt-1.5 block">
          <input
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Your password"
            className={`${field} pr-16`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-stone-500 hover:text-ink"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "Hide" : "Show"}
          </button>
        </span>
      </label>

      {state?.error && (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200" role="alert">
          <span aria-hidden="true">⚠</span>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3.5 font-semibold text-white transition hover:bg-stone-800 disabled:opacity-70"
      >
        {pending && (
          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
        )}
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
