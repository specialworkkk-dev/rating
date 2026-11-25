"use client";

import { useState } from "react";
import { getStoredDeviceId } from "@/lib/clientDevice";
import { inputClass as input } from "./ui";

export default function FeedbackForm({ ratingId, onSent }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratingId, deviceId: getStoredDeviceId(), ...data }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      onSent();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="sr-only">What went wrong?</span>
        <textarea
          name="message"
          required
          minLength={3}
          maxLength={2000}
          rows={4}
          placeholder="What went wrong? The owner will read this personally."
          className={input}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="name" maxLength={80} placeholder="Your name (optional)" className={input} autoComplete="name" />
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          maxLength={20}
          placeholder="Phone (optional)"
          className={input}
          autoComplete="tel"
        />
      </div>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-ink px-6 py-4 text-lg font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send to owner"}
      </button>
    </form>
  );
}
