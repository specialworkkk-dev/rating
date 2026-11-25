import UnavailableIcon from "./UnavailableIcon";
import { fmtDate } from "./ui";

const COPY = {
  paused: {
    title: "Your account is paused",
    body: "Your rating page isn’t collecting ratings or complaints right now.",
  },
  trial_ended: {
    title: "Your free trial has ended",
    body: "Your rating page stopped collecting ratings when the trial ended.",
  },
  payment_due: {
    title: "Your plan has expired",
    body: "Your rating page stopped collecting ratings when your plan ended.",
  },
};

/** Owner dashboard state when the shop is paused, its trial ended, or payment is due. */
export default function PausedNotice({ reason, shopName, endedAt }) {
  const copy = COPY[reason] || COPY.paused;
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center rounded-3xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-stone-200">
      <UnavailableIcon tone="red" />
      <p className="mt-6 text-sm font-medium text-muted">{shopName}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">{copy.title}</h1>
      <p className="mt-3 text-muted">
        {copy.body}
        {reason !== "paused" && endedAt ? ` (${fmtDate(endedAt)})` : ""}
      </p>
      <ul className="mt-6 w-full space-y-2 rounded-2xl bg-stone-50 p-4 text-left text-sm">
        <li className="flex gap-2">
          <span className="text-emerald-600">✓</span> Your ratings, complaints and settings are safe. Nothing is deleted.
        </li>
        <li className="flex gap-2">
          <span className="text-emerald-600">✓</span> Your QR posters keep working as soon as the account is active again.
        </li>
      </ul>
      <p className="mt-6 text-sm text-muted">To continue, please contact your account manager.</p>
    </section>
  );
}
