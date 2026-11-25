"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ links }) {
  const pathname = usePathname();
  if (!links.length) return null;
  return (
    <nav className="flex items-center gap-1 text-sm">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              active ? "bg-stone-100 text-ink" : "text-stone-500 hover:bg-stone-50 hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
