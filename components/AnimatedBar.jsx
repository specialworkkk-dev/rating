"use client";

import { useEffect, useState } from "react";

/** A progress bar that grows from 0 to `percent` after mount. */
export default function AnimatedBar({ percent, color, delay = 0, label }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className="block h-2.5 w-full overflow-hidden rounded-full bg-stone-100"
    >
      <span
        className="block h-full rounded-full transition-[width] duration-1000 ease-out motion-reduce:transition-none"
        style={{ width: `${width}%`, backgroundColor: color, transitionDelay: `${delay}ms` }}
      />
    </span>
  );
}
