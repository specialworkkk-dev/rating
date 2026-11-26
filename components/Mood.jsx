// The same emoji + word everywhere the app says "happy" or "unhappy", so the
// mood reads at a glance but is never emoji alone (screen readers hear the word).

export const MOODS = {
  happy: { emoji: "😊", label: "Happy" },
  unhappy: { emoji: "😞", label: "Unhappy" },
};

/**
 * `stacked`: emoji above the word on phones, side by side from tablet up
 * (for narrow table columns). `children` replaces the word, e.g. "Happy (4–5★)".
 */
export function MoodLabel({ kind, stacked = false, children }) {
  const m = MOODS[kind];
  return (
    <span className={stacked ? "inline-flex flex-col items-end gap-0.5 leading-tight sm:flex-row sm:items-center sm:gap-1" : "inline-flex items-center gap-1"}>
      <span aria-hidden="true" className="text-[1.1em] leading-none">
        {m.emoji}
      </span>
      <span>{children ?? m.label}</span>
    </span>
  );
}

/** Small Google "G", for "Google" labels. */
export function GoogleMark({ className = "size-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.4a4.6 4.6 0 0 1-2 3.03v2.5h3.23c1.9-1.75 2.97-4.32 2.97-7.34z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96L6.4 13.9z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98z" />
    </svg>
  );
}

/** "G Google" label; `stacked` like MoodLabel. */
export function GoogleLabel({ stacked = false, children = "Google" }) {
  return (
    <span className={stacked ? "inline-flex flex-col items-end gap-0.5 leading-tight sm:flex-row sm:items-center sm:gap-1" : "inline-flex items-center gap-1"}>
      <GoogleMark />
      <span>{children}</span>
    </span>
  );
}
