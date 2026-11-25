"use client";

import { useEffect, useState } from "react";
import { getStoredDeviceId, storeDeviceId } from "@/lib/clientDevice";
import FeedbackForm from "./FeedbackForm";
import GoogleReviewLink from "./GoogleReviewLink";
import StarRating from "./StarRating";
import Unavailable from "@/app/r/[slug]/Unavailable";

const sourceFromUrl = () => (new URLSearchParams(window.location.search).get("src") === "nfc" ? "nfc" : "qr");

// One request per page load: counts the scan (first open this session only,
// so reloads are not counted twice) and tells us if the viewer is the shop's
// own logged-in owner. The page itself is cached for everyone, so this has to
// be asked with this phone's cookies.
function useVisit(slug, onOwnShop) {
  useEffect(() => {
    // The source is read here, from the address, so NFC taps are never logged as QR.
    const source = sourceFromUrl();
    const key = `rb_scan_${slug}`;
    let count = true;
    try {
      if (sessionStorage.getItem(key)) count = false;
      else sessionStorage.setItem(key, "1");
    } catch {}
    fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, source, count }),
      keepalive: true,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.ownShop && onOwnShop())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 rounded-full bg-white p-0.5" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.4a4.6 4.6 0 0 1-2 3.03v2.5h3.23c1.9-1.75 2.97-4.32 2.97-7.34z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96L6.4 13.9z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98z" />
    </svg>
  );
}

/** "nfc" when opened from an NFC card (?src=nfc), else "qr". Read in the browser so the page can be cached. */
function useSource() {
  const [source, setSource] = useState("qr");
  useEffect(() => {
    setSource(sourceFromUrl());
  }, []);
  return source;
}

export default function RatingFlow({ shop }) {
  const source = useSource();

  const [stars, setStars] = useState(0);
  const [step, setStep] = useState("rate"); // rate | google | feedback | thanks
  const [ratingId, setRatingId] = useState(null);
  const [googleUrl, setGoogleUrl] = useState(shop.googleReviewUrl);
  const [thanksFor, setThanksFor] = useState(null); // "google" | "feedback"
  const [previousStars, setPreviousStars] = useState(null);
  const [openedGoogle, setOpenedGoogle] = useState(false);
  const [ownShop, setOwnShop] = useState(false);

  useVisit(shop.slug, () => setOwnShop(true));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function rate(n) {
    setStars(n);
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: shop.slug, stars: n, source, deviceId: getStoredDeviceId() }),
      });
      const json = await res.json().catch(() => ({}));
      // The page may be cached for up to an hour; the server always knows the
      // live status. If the shop was paused meanwhile, say so politely.
      if (res.status === 403 && json.code === "own_shop") {
        setOwnShop(true);
        setStars(0);
        return;
      }
      if (res.status === 403) {
        setStep("unavailable");
        return;
      }
      if (!res.ok) throw new Error(json.error || "Couldn’t save your rating. Please try again.");
      setRatingId(json.ratingId);
      storeDeviceId(json.deviceId);
      setPreviousStars(json.updated && json.previousStars !== n ? json.previousStars : null);
      setGoogleUrl(json.googleReviewUrl);
      setStep(json.next === "google" ? "google" : "feedback");
    } catch (err) {
      setError(err.message);
      setStars(0);
    } finally {
      setBusy(false);
    }
  }

  function thank(kind) {
    setThanksFor(kind);
    setStep("thanks");
  }

  const card = "mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200";

  // A returning customer updates their one rating instead of adding another.
  const updatedNote = previousStars ? (
    <p className="mb-4 rounded-xl bg-stone-50 px-3 py-2 text-center text-xs text-muted">
      You rated us {previousStars}★ before. We’ve updated it to {stars}★.
    </p>
  ) : null;

  // Google policy: every customer gets the same invitation to review on
  // Google, whatever they rated. Never hide or shrink it for low ratings.
  const googleAsk = googleUrl ? (
    <div className="text-center">
      <p className="mb-4 text-muted">
        Would you share your experience on Google? It takes 30 seconds and helps other customers.
      </p>
      {openedGoogle ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          ✓ Google opened in a new tab. Thank you!
        </p>
      ) : (
        <GoogleReviewLink href={googleUrl} ratingId={ratingId} onClick={() => setOpenedGoogle(true)}>
          <GoogleG /> Post on Google
        </GoogleReviewLink>
      )}
    </div>
  ) : null;

  const changeRating = (
    <p className="mt-5 text-center">
      <button
        type="button"
        onClick={() => {
          setOpenedGoogle(false);
          setStep("rate");
        }}
        className="text-sm text-stone-500"
      >
        Change my rating
      </button>
    </p>
  );

  /** Count a first-screen "Review on Google" tap (survives the tab switching to Google). */
  function recordDirectTap() {
    const body = JSON.stringify({ slug: shop.slug, deviceId: getStoredDeviceId() });
    const sent = navigator.sendBeacon?.("/api/google-direct", new Blob([body], { type: "application/json" }));
    if (!sent) {
      fetch("/api/google-direct", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  }

  // Owners can't rate or review their own shop (Google removes self-reviews).
  if (ownShop) {
    return (
      <section className={`${card} text-center`}>
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-2xl" aria-hidden="true">
          🔒
        </span>
        <h2 className="mt-4 text-lg font-semibold">This is your own rating page</h2>
        <p className="mt-2 text-sm text-muted">
          You’re logged in as the owner, so you can’t rate your own shop. Google removes reviews written by the business
          itself, and that can hurt your listing.
        </p>
        <p className="mt-3 text-sm text-muted">Share this page with customers, or open it in a private window to see what they see.</p>
      </section>
    );
  }

  if (step === "unavailable") {
    return <Unavailable shopName={shop.name} />;
  }

  if (step === "thanks") {
    return (
      <section className={`${card} text-center`}>
        <p className="text-5xl">🙏</p>
        <h2 className="mt-3 text-xl font-semibold">Thank you!</h2>
        <p className="mt-2 text-muted">
          {thanksFor === "feedback"
            ? `Your message has been sent to ${shop.name}. They read every message.`
            : `Thanks for rating ${shop.name}. See you again soon!`}
        </p>
        {thanksFor === "feedback" && googleUrl && !openedGoogle && (
          <div className="mt-6 border-t border-stone-100 pt-5">{googleAsk}</div>
        )}
      </section>
    );
  }

  if (step === "google") {
    return (
      <section className={card}>
        {updatedNote}
        <div className="mb-5 text-center">
          <p className="text-4xl">{stars === 5 ? "🤩" : "😊"}</p>
          <h2 className="mt-3 text-xl font-semibold">Thanks for your rating!</h2>
        </div>
        {googleAsk || <p className="text-center text-muted">Thanks for rating {shop.name}!</p>}
        {openedGoogle && (
          <p className="mt-4 text-center">
            <button type="button" onClick={() => thank("google")} className="text-sm font-medium text-ink underline">
              Done
            </button>
          </p>
        )}
        {changeRating}
      </section>
    );
  }

  if (step === "feedback") {
    return (
      <section className={card}>
        {updatedNote}
        <div className="mb-5 text-center">
          <p className="text-4xl">🙏</p>
          <h2 className="mt-3 text-xl font-semibold">Thanks for being honest</h2>
        </div>
        {googleAsk}
        <div className="my-6 flex items-center gap-3 text-xs font-medium tracking-wide text-stone-400 uppercase">
          <span className="h-px flex-1 bg-stone-200" />
          {googleUrl ? "and / or" : ""}
          <span className="h-px flex-1 bg-stone-200" />
        </div>
        <h3 className="text-center font-semibold">Tell the owner privately</h3>
        <p className="mt-1 mb-4 text-center text-sm text-muted">
          Only {shop.name} sees this, so they can put things right.
        </p>
        <FeedbackForm ratingId={ratingId} onSent={() => thank("feedback")} />
        {changeRating}
      </section>
    );
  }

  return (
    <section className={`${card} text-center`}>
      <h2 className="text-lg font-semibold">How was your experience?</h2>
      <p className="mt-1 mb-5 text-sm text-muted">Tap a star to rate</p>
      <StarRating value={stars} onChange={rate} disabled={busy} />
      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
      {/* Anyone can go straight to Google, before or without choosing stars. */}
      {googleUrl && (
        <p className="mt-6 border-t border-stone-100 pt-4 text-sm text-muted">
          Prefer to write on Google directly?{" "}
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={recordDirectTap}
            className="inline-flex items-center gap-1 font-semibold text-ink underline underline-offset-4"
          >
            <GoogleG /> Review on Google
          </a>
        </p>
      )}
    </section>
  );
}
