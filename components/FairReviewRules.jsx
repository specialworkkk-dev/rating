import { FAIR_RULES, FAIR_RULES_WARNING } from "@/lib/fairRules";

export default function FairReviewRules({ compact = false }) {
  return (
    <div>
      <ol className={`space-y-2 ${compact ? "text-xs" : "text-sm"}`}>
        {FAIR_RULES.map((r, i) => (
          <li key={r.title} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
              {i + 1}
            </span>
            <span>
              <span className="font-semibold">{r.title}.</span> <span className="text-stone-600">{r.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className={`mt-3 text-red-700 ${compact ? "text-xs" : "text-sm"}`}>{FAIR_RULES_WARNING}</p>
    </div>
  );
}
