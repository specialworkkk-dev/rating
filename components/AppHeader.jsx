import Link from "next/link";
import { BRAND } from "@/lib/brand";
import AccountMenu from "./AccountMenu";
import BrandMark from "./BrandMark";
import HeaderShell from "./HeaderShell";
import InstallBanner from "./InstallBanner";
import NavLinks from "./NavLinks";

function shopInitials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/**
 * App bar for owners and admins.
 * - owner: pass `shop` ({ name, logoUrl }) and `badge` (unread complaints)
 * - admin: pass `title` and `links`
 */
export default function AppHeader({ user, shop = null, title = "", badge = 0, links = [], showBell = true }) {
  return (
    <>
    <HeaderShell>
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label={`${BRAND.name} home`}>
          <BrandMark className="size-8" />
          <span className="hidden text-[15px] font-bold tracking-tight sm:inline">{BRAND.name}</span>
        </Link>

        <span className="hidden h-6 w-px bg-stone-200 sm:block" aria-hidden="true" />

        {shop ? (
          <div className="flex min-w-0 items-center gap-2.5">
            {shop.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logoUrl} alt="" className="size-7 shrink-0 rounded-lg object-cover ring-1 ring-stone-200" />
            ) : (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-[11px] font-bold text-brand-700">
                {shopInitials(shop.name)}
              </span>
            )}
            <span className="truncate text-[15px] font-semibold">{shop.name}</span>
          </div>
        ) : (
          title && (
            <span className="rounded-md bg-stone-900 px-2 py-0.5 text-xs font-semibold tracking-wide text-white uppercase">
              {title}
            </span>
          )
        )}

        <span className="hidden sm:block">
          <NavLinks links={links} />
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {shop && showBell && (
            <Link
              href="/app/dashboard/feedback"
              className="relative flex size-10 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-ink"
              aria-label={badge ? `${badge} unread messages` : "Messages"}
              title={badge ? `${badge} unread` : "No unread messages"}
            >
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                <path
                  d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {badge > 0 && (
                <span className="absolute top-1 right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] leading-none font-bold text-white ring-2 ring-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          )}
          <AccountMenu name={user.name || ""} email={user.email} role={user.role} />
        </div>
      </div>
      {links.length > 0 && (
        <div className="border-t border-stone-100 sm:hidden">
          <NavLinks links={links} variant="tabs" />
        </div>
      )}
    </HeaderShell>
    <InstallBanner />
    </>
  );
}
