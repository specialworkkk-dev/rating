"use client";

import { useActionState } from "react";
import { inputClass } from "@/components/ui";
import { login } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="space-y-3">
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Email"
        className={inputClass}
      />
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="Password"
        className={inputClass}
      />
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-ink px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
