"use client";

import { useEffect, useState } from "react";

/**
 * Sticky header bar that gains a soft shadow once the page scrolls. Solid
 * white on purpose: a translucent backdrop-blur smudges the dark hero below.
 */
export default function HeaderShell({ children }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white transition-shadow ${
        scrolled ? "border-stone-200 shadow-[0_1px_12px_rgba(28,25,23,0.06)]" : "border-stone-200/70"
      }`}
    >
      {children}
    </header>
  );
}
