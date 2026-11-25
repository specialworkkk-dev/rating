"use client";

import { useEffect, useState } from "react";
import { getStoredDeviceId, storeDeviceId } from "@/lib/clientDevice";
import FeedbackForm from "./FeedbackForm";
import GoogleReviewLink from "./GoogleReviewLink";
import StarRating from "./StarRating";

function useLogScan(slug, source) {
  useEffect(() => {
    // Count a scan once per browser session, not on every reload.
    const key = `rb_scan_${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, source }),
      keepalive: true,
    }).catch(() => {});
  }, [slug, source]);
}

export default function RatingFlow({ shop, source }) {
  useLogScan(shop.slug, source);

  const [stars, setStars] = useState(0);
  const [step, setStep] = useState("rate"); // rate | google | feedback | thanks
  const [ratingId, setRatingId] = useState(null);
  const [googleUrl, setGoogleUrl] = useState(shop.googleReviewUrl);
  const [thanksFor, setThanksFor] = useState(null); // "google" | "feedback"
  const [previousStars, setPreviousStars] = useState(null);
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

  if (step === "thanks") {
    return (
      <section className={`${card} text-center`}>
        <p className="text-5xl">🙏</p>
        <h2 className="mt-3 text-xl font-semibold">Thank you!</h2>
        <p className="mt-2 text-muted">
          {thanksFor === "feedback"
            ? `Your message has been sent to ${shop.name}. They’ll use it to do better.`
            : `Your review helps ${shop.name} a lot. See you again soon!`}
        </p>
      </section>
    );
  }

  if (step === "google") {
    return (
      <section className={`${card} text-center`}>
        {updatedNote}
        <p className="text-4xl">{stars === 5 ? "🤩" : "😊"}</p>
        <h2 className="mt-3 text-xl font-semibold">Glad you liked it!</h2>
        {googleUrl ? (
          <>
            <p className="mt-2 mb-6 text-muted">
              Would you share your experience on Google? It takes 30 seconds and helps others find us.
            </p>
            <GoogleReviewLink href={googleUrl} ratingId={ratingId} onClick={() => thank("google")}>
              <span aria-hidden="true">⭐</span> Post on Google
            </GoogleReviewLink>
          </>
        ) : (
          <p className="mt-2 text-muted">Thanks for rating {shop.name}!</p>
        )}
        <button type="button" onClick={() => setStep("rate")} className="mt-5 text-sm text-stone-500">
          Change my rating
        </button>
      </section>
    );
  }

  if (step === "feedback") {
    return (
      <section className={card}>
        {updatedNote}
        <div className="text-center">
          <p className="text-4xl">😔</p>
          <h2 className="mt-3 text-xl font-semibold">Sorry about that!</h2>
          <p className="mt-2 mb-5 text-muted">Tell us what went wrong and we’ll make it right.</p>
        </div>
        <FeedbackForm ratingId={ratingId} onSent={() => thank("feedback")} />
        {/* Google policy: unhappy customers must still be able to post publicly. */}
        {googleUrl && (
          <p className="mt-5 text-center text-sm">
            <GoogleReviewLink href={googleUrl} ratingId={ratingId} variant="link" onClick={() => thank("google")}>
              Or post a review on Google
            </GoogleReviewLink>
          </p>
        )}
        <p className="mt-3 text-center">
          <button type="button" onClick={() => setStep("rate")} className="text-sm text-stone-500">
            Change my rating
          </button>
        </p>
      </section>
    );
  }

  return (
    <section className={`${card} text-center`}>
      <h2 className="text-lg font-semibold">How was your experience?</h2>
      <p className="mt-1 mb-5 text-sm text-muted">Tap a star to rate</p>
      <StarRating value={stars} onChange={rate} disabled={busy} />
      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
    </section>
  );
}
