"use client";

import { useEffect, useState } from "react";
import { inputClass } from "./ui";

// "Follow for offers" on a shop's page (only for shops with Offers switched on).
// Kept apart from rating: it never mentions stars, reviews or Google.
//  - Android / computers / iPhone home-screen app: browser notifications.
//  - iPhone in Safari (no notifications there): WhatsApp opt-in, or the
//    "Add to Home Screen" steps.

const SW = "/offers-sw.js";
const SCOPE = "/r/";

function base64ToBytes(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function detect() {
  const ua = navigator.userAgent || "";
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
  const push = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  // In-app browsers (Instagram, Facebook, some WebViews) can't show notifications.
  const inApp = /FBAN|FBAV|Instagram|Line\/|; wv\)/.test(ua);
  return {
    ios,
    push: push && !inApp,
    inApp,
    device: ios ? "iPhone" : /Android/.test(ua) ? "Android" : "Computer",
    iosNeedsHomeScreen: ios && !standalone,
    blocked: push && Notification.permission === "denied",
  };
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.getRegistration(SCOPE);
  return reg ? reg.pushManager.getSubscription() : null;
}

export default function FollowOffers({ slug, shopName }) {
  const [env, setEnv] = useState(null);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [help, setHelp] = useState(null); // "blocked" | "dismissed" | "hidden"
  const [waDone, setWaDone] = useState(false);
  const key = `rb_follow_${slug}`;

  useEffect(() => {
    const d = detect();
    setEnv(d);
    setShowWhatsApp(d.iosNeedsHomeScreen || !d.push);
    if (d.blocked) setHelp("blocked");
    try {
      if (localStorage.getItem(key) && d.push && Notification.permission === "granted") setFollowing(true);
    } catch {}
  }, [key]);

  async function follow() {
    setBusy(true);
    setMsg("");
    setHelp(null);
    try {
      const asked = Date.now();
      const permission = await Notification.requestPermission();
      if (permission === "denied") return setHelp("blocked");
      if (permission !== "granted") {
        // Answered "default" at once: Chrome hid the question (quiet prompt). Later: the customer closed it.
        return setHelp(Date.now() - asked < 800 ? "hidden" : "dismissed");
      }
      const reg = await navigator.serviceWorker.register(SW, { scope: SCOPE });
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
        }));
      const res = await fetch("/api/offers/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, subscription: sub.toJSON(), device: env.device }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn’t follow");
      try {
        localStorage.setItem(key, "1");
      } catch {}
      setFollowing(true);
    } catch (err) {
      setMsg(err?.message || "Couldn’t follow. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function unfollow() {
    setBusy(true);
    setMsg("");
    try {
      const sub = await currentSubscription();
      if (sub) {
        await fetch("/api/offers/follow", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, endpoint: sub.endpoint }),
        });
      }
      try {
        localStorage.removeItem(key);
      } catch {}
      setFollowing(false);
    } finally {
      setBusy(false);
    }
  }

  async function joinWhatsApp(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/offers/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, phone: f.get("phone"), name: f.get("name"), consent: f.get("consent") === "on" }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setMsg(json?.error || "Couldn’t save. Please try again.");
    setWaDone(true);
  }

  if (!env) return null;

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-stone-200" aria-label="Offers">
      <p className="text-2xl" aria-hidden="true">
        🔔
      </p>
      <h2 className="mt-1 font-semibold">Get {shopName}’s offers</h2>

      {!showWhatsApp && (
        <>
          <p className="mt-1 text-sm text-muted">
            {following ? "You’ll get their offers as notifications on this phone." : "Discounts and specials, straight to this phone. Stop any time."}
          </p>
          <div className="mt-4">
            {following ? (
              <button type="button" onClick={unfollow} disabled={busy} className="text-sm text-stone-500 underline">
                ✓ Following · Unfollow
              </button>
            ) : (
              <button
                type="button"
                onClick={follow}
                disabled={busy}
                className="w-full rounded-2xl bg-ink px-6 py-3.5 font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Please wait…" : "🔔 Follow for offers"}
              </button>
            )}
          </div>
          {!following && (
            <button type="button" onClick={() => setShowWhatsApp(true)} className="mt-3 text-xs text-stone-500 underline">
              Prefer WhatsApp?
            </button>
          )}
        </>
      )}

      {showWhatsApp &&
        (waDone ? (
          <p className="mt-3 text-sm text-emerald-700">
            ✓ Done. {shopName} will send offers to your WhatsApp. Save their number so the messages reach you.
          </p>
        ) : (
          <form onSubmit={joinWhatsApp} className="mt-3 space-y-3 text-left">
            <p className="text-center text-sm text-muted">Get their offers on WhatsApp instead.</p>
            <input name="phone" type="tel" inputMode="tel" required maxLength={20} placeholder="WhatsApp number" autoComplete="tel" className={inputClass} />
            <input name="name" maxLength={80} placeholder="Your name (optional)" autoComplete="name" className={inputClass} />
            <label className="flex items-start gap-2 text-xs text-stone-600">
              <input name="consent" type="checkbox" required className="mt-0.5 size-4 accent-stone-900" />
              <span>Send me offers from {shopName} on WhatsApp. I can ask them to stop at any time.</span>
            </label>
            <button type="submit" disabled={busy} className="w-full rounded-2xl bg-[#1f8f4e] px-6 py-3.5 font-semibold text-white disabled:opacity-60">
              {busy ? "Saving…" : "Get offers on WhatsApp"}
            </button>
            {env.inApp && (
              <p className="text-center text-xs text-muted">
                For notifications instead, open this page in <b>Chrome</b> (⋮ menu → “Open in Chrome”) and tap Follow.
              </p>
            )}
            {env.iosNeedsHomeScreen && (
              <p className="text-center text-xs text-muted">
                Or get them as notifications: tap <b>Share</b> → <b>Add to Home Screen</b>, open it from your home screen, then tap Follow.
              </p>
            )}
            {!env.iosNeedsHomeScreen && env.push && (
              <button type="button" onClick={() => setShowWhatsApp(false)} className="block w-full text-center text-xs text-stone-500 underline">
                Use notifications instead
              </button>
            )}
          </form>
        ))}

      {help && !following && (
        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-left text-sm text-amber-950 ring-1 ring-amber-200" role="alert">
          {help === "dismissed" && <p>You closed the question without choosing. Tap <b>Follow for offers</b> again and choose <b>Allow</b>.</p>}
          {help === "hidden" && (
            <p>
              Your browser hid the question. Tap the small <b>🔔 bell</b> (or the two-sliders <b>⚙</b> icon) at the left of the web
              address and choose <b>Allow</b>, then tap Follow again.
            </p>
          )}
          {help === "blocked" && (
            <>
              <p className="font-semibold">Notifications are off for this site on your phone. To turn them on:</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                <li>
                  Tap the small icon at the <b>left of the web address</b> (two sliders <b>⚙</b>, or 🔒 / ⓘ). Scroll up a little if
                  you can’t see the address.
                </li>
                <li>
                  <b>Permissions</b> (or Site settings) → <b>Notifications</b> → <b>Allow</b>, then tap Follow again.
                </li>
              </ol>
              <p className="mt-1 text-xs">
                Still blocked? In Chrome: ⋮ → Settings → Site settings → Notifications → turn on, and allow this site. Opened from
                WhatsApp? Tap ⋮ → “Open in Chrome” first.
              </p>
            </>
          )}
          <button type="button" onClick={() => setShowWhatsApp(true)} className="mt-2 font-semibold text-[#1f8f4e] underline">
            Or get offers on WhatsApp instead
          </button>
        </div>
      )}
      {msg && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {msg}
        </p>
      )}
      <p className="mt-4 text-[11px] text-stone-400">
        Only for offers from this shop. <a href="/privacy" className="underline">Privacy</a>
      </p>
    </section>
  );
}
