import Link from "next/link";
import AdminShopFilters from "@/components/AdminShopFilters";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";
import { btnPrimary, card, fmtDate } from "@/components/ui";
import { requirePageRole } from "@/lib/session";
import { fmtNum } from "@/lib/format";
import { formatINR } from "@/lib/pricing";
import { isShopActive } from "@/lib/shop";
import { adminShop } from "@/lib/shopInput";
import { getActivityByShop, getBurstCountsByShop } from "@/lib/stats";
import Shop from "@/models/Shop";
import User from "@/models/User";

export const metadata = { title: "Admin · Review Booster" };

const PAGE_SIZE = 20;

/** Which billing bucket a shop is in right now. */
function category(s) {
  if (s.status === "paused") return "paused";
  if (!s.live) return "due";
  return s.status === "active" ? "paid" : "trial";
}

const SORTERS = {
  new: (a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""),
  name: (a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  price: (a, b) => b.monthlyPrice - a.monthlyPrice,
  activity: (a, b) => b.activity.ratings - a.activity.ratings,
};

export default async function AdminHome({ searchParams }) {
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
  for (const s of shops) s.category = category(s);

  const payingShops = shops.filter((s) => s.status === "active" && s.live);
  const paying = payingShops.length;
  const trials = shops.filter((s) => s.status === "trial" && s.live).length;
  const due = shops.filter((s) => s.status !== "paused" && !s.live).length;
  // Each shop pays its own agreed price.
  const mrr = payingShops.reduce((sum, s) => sum + s.monthlyPrice, 0);

  // Filters, sort and pagination (all shops are small enough to do in memory).
  const sp = await searchParams;
  const q = String(sp.q || "").trim().toLowerCase();
  const status = ["paid", "trial", "due", "paused"].includes(sp.status) ? sp.status : "all";
  const sort = SORTERS[sp.sort] ? sp.sort : "new";
  const counts = { all: shops.length, paid: 0, trial: 0, due: 0, paused: 0 };
  for (const s of shops) counts[s.category] += 1;

  const filtered = shops
    .filter((s) => status === "all" || s.category === status)
    .filter((s) => !q || [s.name, s.slug, s.owner?.email, s.owner?.name].some((v) => v?.toLowerCase().includes(q)))
    .sort(SORTERS[sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(sp.page) || 1), pages);
  const pageShops = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hrefFor = (n) => {
    const next = new URLSearchParams();
    if (q) next.set("q", sp.q);
    if (status !== "all") next.set("status", status);
    if (sort !== "new") next.set("sort", sort);
    if (n > 1) next.set("page", String(n));
    const qs = next.toString();
    return qs ? `/admin?${qs}` : "/admin";
  };

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
        <h1 className="text-xl font-bold">Shops</h1>
        <Link href="/admin/shops/new" className={`${btnPrimary} ml-auto`}>
          + Add shop
        </Link>
      </div>

      {shops.length > 0 && <AdminShopFilters counts={counts} />}

      {shops.length === 0 ? (
        <p className={`${card} text-center text-muted`}>No shops yet. Add your first one.</p>
      ) : pageShops.length === 0 ? (
        <div className={`${card} text-center`}>
          <p className="font-medium">No shops match these filters</p>
          <Link href="/admin" className="mt-2 inline-block text-sm font-medium text-brand-700 underline">
            Clear filters
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {pageShops.map((s) => (
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
      <Pagination
        page={page}
        pages={pages}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        hrefFor={hrefFor}
        noun={filtered.length === 1 ? "shop" : "shops"}
      />
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
      <dd className="font-semibold tabular-nums">{fmtNum(value)}</dd>
    </div>
  );
}
