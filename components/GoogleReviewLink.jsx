"use client";

function trackClick(ratingId) {
  if (!ratingId) return;
  const url = `/api/rating/${ratingId}/google-click`;
  // sendBeacon survives the page being backgrounded while Google opens.
  if (!navigator.sendBeacon?.(url)) {
    fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  }
}

export default function GoogleReviewLink({ href, ratingId, onClick, variant = "primary", children }) {
  const styles =
    variant === "primary"
      ? "flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-4 text-lg font-semibold text-white shadow-sm active:bg-brand-600"
      : "font-medium text-stone-600 underline underline-offset-4";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles}
      onClick={() => {
        trackClick(ratingId);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
