// The offer as customers see it after tapping a notification. Used by the
// real offer page and by the owner's preview, so they can never differ.
// On purpose: no stars, no review request, no Google button.
const dateFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export default function OfferCard({ shopName, mapsUrl, text, endsAt, available = true }) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200">
      {available ? (
        <>
          <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Offer</p>
          <p className="mt-3 text-2xl leading-snug font-bold break-words whitespace-pre-line">{text || "Your offer appears here"}</p>
          {endsAt && <p className="mt-3 text-sm text-muted">Valid till {dateFmt.format(new Date(endsAt))}</p>}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-3.5 font-semibold text-white"
            >
              📍 Directions to {shopName}
            </a>
          )}
        </>
      ) : (
        <>
          <p className="text-3xl" aria-hidden="true">
            🕊️
          </p>
          <p className="mt-2 text-lg font-semibold">This offer is no longer available</p>
          <p className="mt-1 text-sm text-muted">It has ended or was removed by {shopName}.</p>
        </>
      )}
    </section>
  );
}
