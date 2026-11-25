import { fmtNum } from "@/lib/format";

/**
 * Warning shown when Google taps jump far above a shop's normal level.
 * variant "owner" (dashboard) or "admin" (shop page, with a call script).
 */
export default function SpikeWarning({ spike, variant = "owner" }) {
  if (!spike) return null;
  const when = spike.label === "today" ? "today" : "yesterday";
  const normal = spike.normal < 1 ? "less than 1" : `about ${fmtNum(spike.normal)}`;

  return (
    <section className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-300" role="alert">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-lg" aria-hidden="true">
          ⚠️
        </span>
        <div className="min-w-0 space-y-2">
          <h2 className="font-semibold text-amber-950">Unusual jump in Google reviews {when}</h2>
          <p className="text-sm text-amber-900">
            <strong>{fmtNum(spike.count)}</strong> customers tapped “Post on Google” {when}, compared with {normal} on a
            normal day. Google can treat sudden jumps as suspicious and remove reviews, even genuine ones.
          </p>
          {variant === "owner" ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
              <li>Keep asking every customer the same way you always do.</li>
              <li>Don’t run review campaigns, offers or “review day” events.</li>
              <li>Don’t ask friends, family or staff to review your shop.</li>
            </ul>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
              <li>Call the owner and ask what happened {when} (an event, an offer, staff reviewing?).</li>
              <li>Remind them: no rewards for reviews, no review drives, no staff or family reviews.</li>
              <li>Check “Unusual activity” below for many ratings from one network.</li>
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
