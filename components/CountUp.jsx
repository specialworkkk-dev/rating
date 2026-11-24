"use client";

import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Animates a number from its previous value (0 on first render) to `value`. */
export default function CountUp({ value, decimals = 0, suffix = "", duration = 900, delay = 0 }) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0); // what is on screen right now, for resuming

  useEffect(() => {
    const start = shownRef.current;
    const show = (v) => {
      shownRef.current = v;
      setShown(v);
    };
    if (prefersReducedMotion() || start === value) {
      show(value);
      return;
    }
    let raf;
    let t0;
    const tick = (now) => {
      t0 ??= now + delay;
      const t = Math.min(1, Math.max(0, (now - t0) / duration));
      show(start + (value - start) * easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // If interrupted (new value, or React re-running effects), the next run
    // continues from whatever is currently on screen.
    return () => cancelAnimationFrame(raf);
  }, [value, duration, delay]);

  const text = shown.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const final = value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <>
      <span aria-hidden="true" className="tabular-nums">
        {text}
        {suffix}
      </span>
      <span className="sr-only">
        {final}
        {suffix}
      </span>
    </>
  );
}
