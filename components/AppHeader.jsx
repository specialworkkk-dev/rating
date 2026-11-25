import Link from "next/link";
import { logout } from "@/app/login/actions";
import { BRAND } from "@/lib/brand";
import BrandMark from "./BrandMark";

export default function AppHeader({ title, user, badge = 0, links = [] }) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <BrandMark className="size-7" />
          <span className="hidden sm:inline">{BRAND.name}</span>
        </Link>
        <span className="text-stone-300">/</span>
        <span className="flex items-center gap-2 font-medium">
          {title}
          {badge > 0 && (
            <a
              href="#feedback"
              className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white"
              aria-label={`${badge} unread messages`}
            >
              {badge}
            </a>
          )}
        </span>
        <nav className="flex gap-3 text-sm text-stone-600">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="hidden text-muted sm:inline">{user.email}</span>
          <form action={logout}>
            <button type="submit" className="font-medium text-stone-600 hover:text-ink">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
