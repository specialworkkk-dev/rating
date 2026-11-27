// The offer as customers see it after tapping a notification. Used by the
// real offer page and by the owner's preview, so they can never differ.
// On purpose: no stars, no review request, no Google button.
const dateFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const istDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });

/** "⏰ Ends tonight!", "⏰ Ends tomorrow", "⏰ 3 days left", or the date when further away. */
function endsLabel(endsAt, now = new Date()) {
  if (!endsAt) return null;
  const end = new Date(endsAt);
  const days = Math.round((Date.parse(`${istDay.format(end)}T00:00:00Z`) - Date.parse(`${istDay.format(now)}T00:00:00Z`)) / 864e5);
  if (days <= 0) {
    const hours = Math.max(1, Math.ceil((end - now) / 3_600_000));
    if (hours > 12) return { urgent: true, text: "⏰ Ends today!" };
    return { urgent: true, text: `⏰ Ends tonight! ${hours} hour${hours === 1 ? "" : "s"} left` };
  }
  if (days === 1) return { urgent: true, text: "⏰ Ends tomorrow!" };
  if (days <= 7) return { urgent: true, text: `⏰ Only ${days} days left · till ${dateFmt.format(end)}` };
  return { urgent: false, text: `Valid till ${dateFmt.format(end)}` };
}

const telHref = (p) => `tel:${String(p).replace(/[^\d+]/g, "")}`;

export default function OfferCard({ shopName, mapsUrl, phone, text, endsAt, imageUrl, code, available = true }) {
  const ends = available ? endsLabel(endsAt) : null;
  return (
    <section className="mt-6 overflow-hidden rounded-3xl bg-white text-center shadow-sm ring-1 ring-stone-200">
      {available ? (
        <>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="max-h-72 w-full object-cover" />
          )}
          <div className="p-6">
            <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Offer</p>
            <p className="mt-3 text-2xl leading-snug font-bold break-words whitespace-pre-line">{text || "Your offer appears here"}</p>
            {ends && (
              <p className={`mt-3 inline-block rounded-full px-3 py-1 text-sm ${ends.urgent ? "bg-red-50 font-semibold text-red-700" : "text-muted"}`}>
                {ends.text}
              </p>
            )}
            {code && (
              <div className="mt-5 rounded-2xl border-2 border-dashed border-brand-500 bg-brand-50 p-3">
                <p className="text-xs text-stone-600">Show this code at the counter</p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-ink">{code}</p>
              </div>
            )}
            <div className="mt-5 space-y-2">
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-3.5 font-semibold text-white"
                >
                  📍 Directions to {shopName}
                </a>
              )}
              {phone && (
                <a href={telHref(phone)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 font-semibold text-white">
                  📞 Call shop
                </a>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-6">
          <p className="text-3xl" aria-hidden="true">
            🕊️
          </p>
          <p className="mt-2 text-lg font-semibold">This offer is no longer available</p>
          <p className="mt-1 text-sm text-muted">It has ended or was removed by {shopName}.</p>
        </div>
      )}
    </section>
  );
}
