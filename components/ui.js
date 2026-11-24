export const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export const smallInputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60";

export const btnSecondary =
  "inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-stone-50 disabled:opacity-60";

export const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export const fmtDate = (d) => (d ? dateFmt.format(new Date(d)) : "—");
export const fmtDateTime = (d) => (d ? dateTimeFmt.format(new Date(d)) : "—");
