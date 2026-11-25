"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Header navigation. `variant="bar"` is the inline version (tablet/desktop);
 * `variant="tabs"` is the full-width second row on phones.
 * Each link: { href, label, exact?, badge? }.
 */
export default function NavLinks({ links, variant = "bar" }) {
  const pathname = usePathname();
  if (!links.length) return null;
  const tabs = variant === "tabs";

  return (
    <nav className={tabs ? "flex" : "flex items-center gap-1 text-sm"} aria-label="Sections">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            // Load the other tab in the background, so the first tap is instant.
            prefetch={true}
            aria-current={active ? "page" : undefined}
            className={
              tabs
                ? `flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-sm font-medium ${
                    active ? "border-stone-900 text-ink" : "border-transparent text-stone-500"
                  }`
                : `flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
                    active ? "bg-stone-100 text-ink" : "text-stone-500 hover:bg-stone-50 hover:text-ink"
                  }`
            }
          >
            {l.label}
            {l.badge > 0 && (
              <span className="rounded-full bg-red-600 px-1.5 text-[11px] leading-4.5 font-bold text-white tabular-nums">
                {l.badge > 99 ? "99+" : l.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
