"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";

const KEY = "rb_install_hidden_until";
const HIDE_DAYS = 14;

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function isIOS() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}
function hiddenForNow() {
  try {
    return Number(localStorage.getItem(KEY) || 0) > Date.now();
  } catch {
    return false;
  }
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="inline size-4 -translate-y-px align-middle" aria-label="Share">
      <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * "Install the app" banner for owners and admins.
 * Android/desktop Chrome: an Install button. iPhone/iPad: the Share → Add to
 * Home Screen steps (Apple has no install button). Hidden once installed.
 */
export default function InstallBanner() {
  const [mode, setMode] = useState(null); // "prompt" | "ios" | null
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    if (isStandalone() || hiddenForNow()) return;
    if (isIOS()) {
      setMode("ios");
      return;
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setMode("prompt");
    };
    const onInstalled = () => setMode(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const hide = () => {
    try {
      localStorage.setItem(KEY, String(Date.now() + HIDE_DAYS * 864e5));
    } catch {}
    setMode(null);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice.catch(() => ({ outcome: "dismissed" }));
    setDeferred(null);
    if (outcome === "accepted") setMode(null);
  };

  if (!mode) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-sm ring-1 ring-stone-200 sm:flex-nowrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 basis-48">
          <p className="font-semibold">Install the {BRAND.name} app</p>
          {mode === "ios" ? (
            <p className="text-sm text-muted">
              Tap <ShareIcon /> <span className="font-medium text-ink">Share</span>, then{" "}
              <span className="font-medium text-ink">“Add to Home Screen”</span>. Open it from your home screen next time.
            </p>
          ) : (
            <p className="text-sm text-muted">Open your dashboard from the home screen, without searching for the link.</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {mode === "prompt" && (
            <button type="button" onClick={install} className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">
              Install
            </button>
          )}
          <button type="button" onClick={hide} className="rounded-xl px-3 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-ink">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
