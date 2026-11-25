"use client";

import { useEffect, useState } from "react";

// Validated diverging scale: blue = happy, grey = neutral, red = unhappy.
const LEVELS = [
  { stars: 5, label: "Excellent", color: "#1c5cab" },
  { stars: 4, label: "Good", color: "#5598e7" },
  { stars: 3, label: "Okay", color: "#aeaba4" },
  { stars: 2, label: "Bad", color: "#e66767" },
  { stars: 1, label: "Terrible", color: "#c23434" },
];

const SIZE = 220;
const STROKE = 30;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 2; // surface gap between slices

/** Ring pie of ratings by star level, with a legend giving each count and share. */
export default function RatingsDonut({ breakdown, total, average }) {
  const [active, setActive] = useState(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const parts = LEVELS.map((l) => ({ ...l, count: breakdown[l.stars] || 0 }));
  const nonZero = parts.filter((p) => p.count > 0);
  let offset = 0;
  const slices = nonZero.map((p) => {
    const len = (p.count / total) * C;
    const s = { ...p, start: offset, len, pct: (p.count / total) * 100 };
    offset += len;
    return s;
  });
  const focus = active ? parts.find((p) => p.stars === active) : null;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="flex flex-col items-center gap-8 md:flex-row md:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" role="img" aria-label={`Ratings by stars: ${parts.map((p) => `${p.stars} stars ${p.count}`).join(", ")}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#f5f5f4" strokeWidth={STROKE} />
          {slices.map((s) => {
            const visible = nonZero.length > 1 ? Math.max(0, s.len - GAP) : s.len;
            return (
              <circle
                key={s.stars}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={active === s.stars ? STROKE + 6 : STROKE}
                strokeDasharray={`${drawn ? visible : 0} ${C}`}
                strokeDashoffset={-s.start}
                className="cursor-pointer transition-[stroke-dasharray,stroke-width,opacity] duration-700 ease-out motion-reduce:transition-none"
                style={{ opacity: active && active !== s.stars ? 0.3 : 1 }}
                onMouseEnter={() => setActive(s.stars)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {total === 0 ? (
            <>
              <p className="text-lg font-semibold text-stone-400">No ratings</p>
              <p className="text-xs text-muted">yet</p>
            </>
          ) : focus ? (
            <>
              <p className="text-sm font-medium text-muted">
                {focus.stars}★ {focus.label}
              </p>
              <p className="text-4xl font-bold tracking-tight tabular-nums">{pct(focus.count)}%</p>
              <p className="text-sm text-muted">
                {focus.count} {focus.count === 1 ? "rating" : "ratings"}
              </p>
            </>
          ) : (
            <>
              <p className="text-5xl font-bold tracking-tight">{average.toFixed(1)}</p>
              <p className="mt-0.5 text-sm font-medium text-brand-600">average ★</p>
              <p className="text-xs text-muted">
                {total} {total === 1 ? "rating" : "ratings"}
              </p>
            </>
          )}
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1">
        {parts.map((p) => (
          <li key={p.stars}>
            <button
              type="button"
              onMouseEnter={() => setActive(p.stars)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(p.stars)}
              onBlur={() => setActive(null)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                active === p.stars ? "bg-stone-100" : "hover:bg-stone-50"
              } ${p.count === 0 ? "text-stone-400" : ""}`}
            >
              <span className="size-3.5 shrink-0 rounded" style={{ backgroundColor: p.color }} />
              <span className="w-8 shrink-0 font-semibold tabular-nums">{p.stars}★</span>
              <span className="flex-1 truncate">{p.label}</span>
              <span className="w-10 shrink-0 text-right font-semibold tabular-nums">{p.count}</span>
              <span className="w-12 shrink-0 text-right text-muted tabular-nums">{pct(p.count)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
