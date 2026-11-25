import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { btnPrimary, card, fmtDate } from "@/components/ui";
import { requirePageRole } from "@/lib/session";
import { formatINR } from "@/lib/pricing";
import { isShopActive } from "@/lib/shop";
import { adminShop } from "@/lib/shopInput";
import { getActivityByShop, getBurstCountsByShop } from "@/lib/stats";
import Shop from "@/models/Shop";
import User from "@/models/User";

export const metadata = { title: "Admin · Review Booster" };

export default async function AdminHome() {
  await requirePageRole("admin");

  const [docs, activity, bursts] = await Promise.all([
    Shop.find().sort({ createdAt: -1 }).lean(),
    getActivityByShop(30),
    getBurstCountsByShop(),
  ]);
  const owners = await User.find({ _id: { $in: docs.map((s) => s.ownerId).filter(Boolean) } })
    .select("name email")
    .lean();
  const ownerById = Object.fromEntries(owners.map((o) => [String(o._id), o]));
  const shops = docs.map((s) => ({
    ...adminShop(s, ownerById[String(s.ownerId)]),
    live: isShopActive(s),
    activity: activity[String(s._id)] || { scans: 0, ratings: 0, googleClicks: 0, unread: 0 },
    bursts: bursts[String(s._id)] || 0,
  }));

  const payingShops = shops.filter((s) => s.status === "active" && s.live);
  const paying = payingShops.length;
  const trials = shops.filter((s) => s.status === "trial" && s.live).length;
  const due = shops.filter((s) => s.status !== "paused" && !s.live).length;
  // Each shop pays its own agreed price.
  const mrr = payingShops.reduce((sum, s) => sum + s.monthlyPrice, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Paying shops" value={paying} />
        <Summary label="On trial" value={trials} />
        <Summary label="Trial ended / due" value={due} accent={due ? "text-red-600" : ""} />
        <Summary
          label="Monthly revenue"
          value={formatINR(mrr)}
          hint={`≈ ${formatINR(mrr / 30)}/day · goal ₹5,000/day`}
        />
      </div>

      <div className="flex items-center">
        <h1 className="text-xl font-bold">Shops ({shops.length})</h1>
        <Link href="/admin/shops/new" className={`${btnPrimary} ml-auto`}>
          + Add shop
        </Link>
      </div>

      {shops.length === 0 ? (
        <p className={`${card} text-center text-muted`}>No shops yet. Add your first one.</p>
      ) : (
        <ul className="space-y-3">
          {shops.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/shops/${s.id}`}
                className={`${card} flex flex-wrap items-center gap-x-5 gap-y-2 hover:ring-brand-500`}
              >
                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{s.name}</span>
                    <StatusBadge shop={s} />
                    {s.owner && !s.rulesAcceptedAt && (
                      <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-700">
                        rules not agreed
                      </span>
                    )}
                    {s.bursts > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                        ⚠ unusual activity
                      </span>
                    )}
                    {s.activity.unread > 0 && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                        {s.activity.unread} unread
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    /r/{s.slug} · {s.owner ? s.owner.email : "no owner login"}
                    {!s.googlePlaceId && " · ⚠ no Place ID"}
                  </p>
                </div>
                <dl className="flex gap-5 text-sm">
                  <Metric label="Scans" value={s.activity.scans} />
                  <Metric label="Ratings" value={s.activity.ratings} />
                  <Metric label="→ Google" value={s.activity.googleClicks} />
                </dl>
                <p className="w-full text-xs text-muted sm:w-auto sm:text-right">
                  <span className="font-semibold text-ink">{formatINR(s.monthlyPrice)}/mo</span>
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> · </span>
                  {s.status === "trial"
                    ? `Trial until ${fmtDate(s.trialEndsAt)}`
                    : s.status === "active"
                      ? s.paidUntil
                        ? `Paid until ${fmtDate(s.paidUntil)}`
                        : "Paid (no end date)"
                      : "Paused"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">Scans, ratings and Google clicks are for the last 30 days.</p>
    </div>
  );
}

function Summary({ label, value, hint, accent = "" }) {
  return (
    <div className={card}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="text-center">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
