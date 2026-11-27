import OfferComposer from "@/components/OfferComposer";
import OfferHistoryItem from "@/components/OfferHistoryItem";
import WhatsAppOffersList from "@/components/WhatsAppOffersList";
import { card } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { fmtNum } from "@/lib/format";
import { LEGAL } from "@/lib/legal";
import { offersLimit, offersLive, offersUsedThisMonth, pushConfigured } from "@/lib/offers";
import { getOwnerContext } from "@/lib/ownerContext";
import { publicShop } from "@/lib/shop";
import { DEFAULT_OFFERS_PRICE, formatINR } from "@/lib/pricing";
import Follower from "@/models/Follower";
import Offer from "@/models/Offer";
import WhatsAppOptIn from "@/models/WhatsAppOptIn";

export const metadata = { title: `Offers · ${BRAND.name}` };

const sentFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

function Premium({ shop }) {
  const price = Number.isFinite(shop.offersPrice) ? shop.offersPrice : DEFAULT_OFFERS_PRICE;
  return (
    <section className={`${card} space-y-4 text-center`}>
      <p className="text-4xl" aria-hidden="true">
        🔔
      </p>
      <div>
        <p className="text-xs font-bold tracking-wide text-amber-700 uppercase">⭐ Premium</p>
        <h1 className="mt-1 text-xl font-bold">Send offers to your customers’ phones</h1>
      </div>
      <ul className="mx-auto max-w-sm space-y-2 text-left text-sm text-stone-700">
        <li>✓ Customers tap “Follow for offers” on your rating page</li>
        <li>✓ You write an offer, e.g. “🎉 10% off this weekend!”, and press Send</li>
        <li>✓ It appears on their phones within seconds, like an app notification</li>
        <li>✓ iPhone customers can get them on WhatsApp</li>
      </ul>
      <p className="text-sm">
        <b>{formatINR(price)}/month</b> on top of your plan.
      </p>
      <p className="text-sm text-muted">
        To switch it on, contact us{LEGAL.contactEmail ? " at " : ""}
        {LEGAL.contactEmail && (
          <a href={`mailto:${LEGAL.contactEmail}`} className="font-medium text-brand-700 underline">
            {LEGAL.contactEmail}
          </a>
        )}
        {LEGAL.contactEmail ? "" : " (your account manager)"}.
      </p>
    </section>
  );
}

export default async function OffersPage() {
  const { shop, paused } = await getOwnerContext();
  if (!shop?.offersEnabled) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Premium shop={shop || {}} />
      </main>
    );
  }

  const [devices, waTotal, waPeople, used, offers] = await Promise.all([
    Follower.aggregate([{ $match: { shopId: shop._id } }, { $group: { _id: "$device", n: { $sum: 1 } } }]),
    WhatsAppOptIn.countDocuments({ shopId: shop._id }),
    WhatsAppOptIn.find({ shopId: shop._id }).sort({ createdAt: -1 }).limit(50).lean(),
    offersUsedThisMonth(shop._id),
    Offer.find({ shopId: shop._id }).sort({ sentAt: -1 }).limit(120).lean(),
  ]);
  const followers = devices.reduce((a, d) => a + d.n, 0);
  const byDevice = Object.fromEntries(devices.map((d) => [d._id, d.n]));
  const limit = offersLimit(shop);
  const live = offersLive(shop) && pushConfigured();

  // History grouped by month, newest first.
  const groups = [];
  for (const o of offers) {
    const m = monthFmt.format(o.sentAt);
    if (groups.at(-1)?.month !== m) groups.push({ month: m, items: [] });
    groups.at(-1).items.push({
      id: String(o._id),
      text: o.text,
      sentLabel: sentFmt.format(o.sentAt),
      endsLabel: o.endsAt ? dayFmt.format(o.endsAt) : null,
      url: `/r/${shop.slug}/offer/${o._id}`,
      followers: o.followers || 0,
      sentTo: o.sentTo || 0,
      removed: o.removed || 0,
    });
  }

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-bold">Offers</h1>
        <p className="mt-1 text-sm text-muted">Send offers to customers who follow your shop. ⭐ Premium</p>
      </div>

      {paused && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Your rating page is paused, so offers are paused too. Your followers are kept.
        </p>
      )}
      {!pushConfigured() && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">Offers are being set up. Sending will open soon.</p>
      )}

      <section className={`${card} grid grid-cols-3 gap-3 text-center`}>
        <div>
          <p className="text-2xl font-bold tabular-nums">{fmtNum(followers)}</p>
          <p className="text-xs text-muted">Followers</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{fmtNum(byDevice.Android || 0)}</p>
          <p className="text-xs text-muted">Android</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{fmtNum((byDevice.Computer || 0) + (byDevice.iPhone || 0) + (byDevice.Other || 0))}</p>
          <p className="text-xs text-muted">iPhone &amp; computer</p>
        </div>
        <p className="col-span-3 text-xs text-muted">
          Customers follow you from your rating page. Plus {fmtNum(waTotal)} on WhatsApp (below).
        </p>
      </section>

      <OfferComposer
        shopName={shop.name}
        logoUrl={shop.logoUrl || null}
        mapsUrl={publicShop(shop).mapsUrl}
        followers={followers}
        used={used}
        limit={limit}
        disabled={!live}
      />

      <section className={card}>
        <h2 className="font-semibold">Sent offers</h2>
        {groups.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No offers sent yet.</p>
        ) : (
          groups.map((g) => (
            <div key={g.month} className="mt-3">
              <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{g.month}</h3>
              <ul className="divide-y divide-stone-100">
                {g.items.map((o) => (
                  <OfferHistoryItem key={o.id} offer={o} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <WhatsAppOffersList
        total={waTotal}
        people={waPeople.map((p) => ({ id: String(p._id), name: p.name || "", phone: p.phone }))}
      />

      <p className="text-xs text-muted">
        Never offer discounts or gifts in exchange for a rating or a Google review. Offers must be open to all your followers.
      </p>
    </main>
  );
}
