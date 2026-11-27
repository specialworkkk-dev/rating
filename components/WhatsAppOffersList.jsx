"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnSecondary, card } from "./ui";

/** Customers who asked for offers on WhatsApp: download, remove, and how to send. */
export default function WhatsAppOffersList({ people, total }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);

  async function remove(id) {
    setBusyId(id);
    await fetch(`/api/dashboard/offers/whatsapp/${id}`, { method: "DELETE" }).catch(() => {});
    setBusyId(null);
    router.refresh();
  }

  return (
    <section className={`${card} space-y-3`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">On WhatsApp ({total})</h2>
          <p className="text-xs text-muted">Mostly iPhone customers. Send them offers yourself, for free, from the WhatsApp Business app.</p>
        </div>
        {total > 0 && (
          <a href="/api/dashboard/offers/whatsapp" download className={btnSecondary}>
            ⬇ Download list
          </a>
        )}
      </div>
      {total === 0 ? (
        <p className="text-sm text-muted">Nobody yet.</p>
      ) : (
        <>
          <ul className="divide-y divide-stone-100 text-sm">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.name || "No name"}</span>
                  <span className="text-muted tabular-nums">{p.phone}</span>
                </span>
                <button type="button" onClick={() => remove(p.id)} disabled={busyId === p.id} className="text-xs text-stone-500 hover:text-red-700">
                  {busyId === p.id ? "Removing…" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
          {total > people.length && <p className="text-xs text-muted">Showing the newest {people.length}. Download the list for everyone.</p>}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">How to send them an offer (free)</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-stone-700">
              <li>Save these numbers in your phone’s contacts.</li>
              <li>
                In the <b>WhatsApp Business</b> app: Tools → <b>Broadcast lists</b> → New list → add them.
              </li>
              <li>Send your offer to the list. Only people who saved your number receive broadcasts.</li>
              <li>If someone asks you to stop, press Remove here and take them off the list.</li>
            </ol>
          </details>
        </>
      )}
    </section>
  );
}
