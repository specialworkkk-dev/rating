import Link from "next/link";
import { LEGAL } from "@/lib/legal";

/** Shared layout for the Privacy Policy and Terms: readable width, contents, plain typography. */
export default function LegalPage({ title, intro, summary, sections, other }) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-stone-500 hover:text-ink">
        ← {LEGAL.provider}
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {LEGAL.updated}</p>
      <p className="mt-5 leading-relaxed text-stone-700">{intro}</p>

      {summary && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <h2 className="font-semibold">In short</h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            {summary.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden="true" className="text-emerald-600">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <nav aria-label="Contents" className="mt-8">
        <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Contents</h2>
        <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-brand-700 hover:underline">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-9">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-6">
            <h2 className="text-lg font-semibold">
              {i + 1}. {s.title}
            </h2>
            <div className="legal mt-3 space-y-3 leading-relaxed text-stone-700">{s.body}</div>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-stone-200 pt-6 text-sm text-muted">
        See also our <Link href={other.href} className="font-medium text-brand-700 underline">{other.label}</Link>.
      </p>
    </main>
  );
}

/** The contact email as a link, or a clear note while it isn't set yet. */
export function ContactEmail() {
  return LEGAL.contactEmail ? (
    <a href={`mailto:${LEGAL.contactEmail}`} className="font-medium text-brand-700 underline">
      {LEGAL.contactEmail}
    </a>
  ) : (
    <span className="font-medium">the email address shown here (being set up)</span>
  );
}
