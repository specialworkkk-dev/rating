import { isShopActive } from "@/lib/shop";

export default function StatusBadge({ shop }) {
  const live = isShopActive({
    ...shop,
    trialEndsAt: shop.trialEndsAt && new Date(shop.trialEndsAt),
    paidUntil: shop.paidUntil && new Date(shop.paidUntil),
  });
  const expired = shop.status !== "paused" && !live;
  const [label, cls] = expired
    ? [shop.status === "trial" ? "Trial ended" : "Payment due", "bg-red-100 text-red-800"]
    : {
        trial: ["Trial", "bg-sky-100 text-sky-800"],
        active: ["Paid", "bg-emerald-100 text-emerald-800"],
        paused: ["Paused", "bg-stone-200 text-stone-700"],
      }[shop.status];

  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}
