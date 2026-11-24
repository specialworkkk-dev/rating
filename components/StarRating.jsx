"use client";

import { useState } from "react";

const LABELS = ["", "Terrible", "Bad", "Okay", "Good", "Excellent"];

export default function StarRating({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex flex-col items-center">
      <div
        role="radiogroup"
        aria-label="Rating"
        className="flex gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}: ${LABELS[n]}`}
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="p-1 transition-transform active:scale-90 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="size-12 sm:size-14" aria-hidden="true">
              <path
                d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z"
                className={n <= shown ? "fill-brand-500" : "fill-stone-200"}
              />
            </svg>
          </button>
        ))}
      </div>
      <p className="mt-2 h-6 text-sm font-medium text-muted">{LABELS[shown]}</p>
    </div>
  );
}
