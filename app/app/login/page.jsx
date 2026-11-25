import { redirect } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import { BRAND } from "@/lib/brand";
import { currentUser, homeFor } from "@/lib/session";
import LoginForm from "./LoginForm";

export const metadata = { title: `Log in · ${BRAND.name}` };

const POINTS = [
  "Customers rate in one tap, with no app to install",
  "Complaints reach you privately, so you can fix them fast",
  "See every scan, rating and review in one place",
];

function Star({ filled = true }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill={filled ? "#f59e0b" : "#57534e"}
        d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z"
      />
    </svg>
  );
}

/** Decorative preview of the dashboard, for the brand panel. */
function PreviewCard() {
  const rows = [
    [5, 68, "#16a34a"],
    [4, 21, "#65a30d"],
    [3, 6, "#f59e0b"],
    [2, 3, "#f97316"],
    [1, 2, "#ef4444"],
  ];
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur" aria-hidden="true">
      <div className="flex items-center gap-4">
        <p className="text-4xl font-bold tracking-tight">4.6</p>
        <div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} />
            ))}
            <Star filled={false} />
          </div>
          <p className="mt-1 text-xs text-stone-400">128 ratings this month</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        {rows.map(([s, p, c]) => (
          <li key={s} className="flex items-center gap-2 text-xs text-stone-400">
            <span className="w-3">{s}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full" style={{ width: `${p}%`, backgroundColor: c }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect(homeFor(user));

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel (large screens) */}
      <aside className="relative hidden overflow-hidden bg-stone-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #16a34a, transparent 65%)" }}
        />

        <div className="relative flex items-center gap-3">
          <BrandMark />
          <span className="text-lg font-semibold tracking-tight">{BRAND.name}</span>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="max-w-md text-4xl leading-tight font-bold tracking-tight">
              Every visit can become a review.
            </h1>
            <p className="mt-4 max-w-md text-stone-400">{BRAND.tagline}</p>
          </div>
          <ul className="space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-stone-300">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs text-brand-500">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
          <PreviewCard />
        </div>

        <p className="relative text-xs text-stone-500">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
      </aside>

      {/* Form */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="text-lg font-semibold tracking-tight">{BRAND.name}</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-muted">Log in to your dashboard.</p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-10 border-t border-stone-200 pt-6 text-center text-sm text-muted">
            New shop, or forgot your password?
            <br />
            Contact your account manager.
          </p>
          <p className="mt-4 text-center text-xs text-muted">
            <a href="/terms" className="underline">Terms of Service</a> · <a href="/privacy" className="underline">Privacy Policy</a>
          </p>
        </div>
      </section>
    </main>
  );
}
