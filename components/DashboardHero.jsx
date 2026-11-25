import { HeroIllustration } from "./illustrations";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Welcome banner at the top of the owner dashboard. */
export default function DashboardHero({ shop, planText, summary, ratingUrl, unread = 0 }) {
  const initials = shop.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <section className="relative overflow-hidden rounded-3xl bg-stone-950 text-white shadow-sm">
      <div
        className="pointer-events-none absolute -top-24 -right-16 size-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #f59e0b, transparent 65%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #2a78d6, transparent 65%)" }}
      />
      <div className="relative grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            {shop.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logoUrl} alt="" className="size-14 shrink-0 rounded-2xl bg-white object-cover ring-2 ring-white/20" />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-xl font-bold text-brand-700 ring-2 ring-white/20">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm text-stone-400">{greeting()} 👋</p>
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{shop.name}</h1>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
              <span className="size-2 rounded-full bg-emerald-400" /> Rating page live
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">{planText}</span>
          </div>

          <p className="mt-5 max-w-xl text-stone-300">{summary}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {unread > 0 && (
              <a
                href="/dashboard/feedback"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-stone-100"
              >
                Open feedback
                <span className="rounded-full bg-red-600 px-1.5 text-xs leading-5 text-white tabular-nums">{unread > 99 ? "99+" : unread}</span>
              </a>
            )}
            <a href="#poster" className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-brand-100">
              Get QR poster
            </a>
            <a
              href={ratingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/15 hover:bg-white/15"
            >
              Open rating page ↗
            </a>
          </div>
        </div>
        <HeroIllustration className="mx-auto hidden w-72 md:block lg:w-80" />
      </div>
    </section>
  );
}
