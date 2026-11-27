"use client";

import { useEffect, useState } from "react";

/** On an offer page: "Stop offers from this shop" (removes this phone's follow). */
export default function UnfollowOffers({ slug, shopName }) {
  const [sub, setSub] = useState(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .getRegistration("/r/")
      .then((reg) => reg?.pushManager.getSubscription())
      .then((s) => s && setSub(s))
      .catch(() => {});
  }, []);

  async function stop() {
    setBusy(true);
    await fetch("/api/offers/follow", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, endpoint: sub.endpoint }),
    }).catch(() => {});
    try {
      localStorage.removeItem(`rb_follow_${slug}`);
    } catch {}
    setBusy(false);
    setDone(true);
  }

  if (done) return <p className="mt-4 text-center text-sm text-emerald-700">✓ You won’t get offers from {shopName} any more.</p>;
  if (!sub) return null;
  return (
    <button type="button" onClick={stop} disabled={busy} className="mt-4 text-center text-sm text-stone-500 underline">
      {busy ? "Stopping…" : `Stop offers from ${shopName}`}
    </button>
  );
}
