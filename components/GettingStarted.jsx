import { StepIcon } from "./illustrations";
import { card } from "./ui";

const STEPS = [
  { icon: "print", title: "Print your QR poster", text: "Download it below. An A5 standee works best on the counter." },
  { icon: "place", title: "Put it where people pay", text: "Next to the bill counter or on tables, at eye level." },
  { icon: "ask", title: "Invite every customer", text: "“Please scan and tell us how it was.” Ask everyone, not only happy faces." },
];

/** Shown until the shop's first rating arrives. */
export default function GettingStarted() {
  return (
    <section className={`${card} border-l-4 border-l-brand-500`}>
      <h2 className="text-lg font-semibold">Get your first ratings in 3 steps</h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3 rounded-2xl bg-stone-50 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <StepIcon name={s.icon} />
            </span>
            <div>
              <p className="text-xs font-semibold text-muted">Step {i + 1}</p>
              <p className="font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
