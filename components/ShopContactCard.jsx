"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { whatsappLink } from "@/lib/format";
import { isIndianMobile, telHref } from "@/lib/phone";
import { btnPrimary, btnSecondary, card, smallInputClass as input } from "./ui";

/** Call / WhatsApp buttons for one number. */
export function PhoneActions({ phone, compact = false }) {
  if (!phone) return null;
  const wa = isIndianMobile(phone) ? whatsappLink(phone) : null;
  const size = compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";
  return (
    <span className="flex flex-wrap gap-2">
      <a href={telHref(phone)} className={`inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 ${size}`}>
        <span aria-hidden="true">📞</span> Call
      </a>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 font-semibold text-emerald-700 hover:bg-emerald-50 ${size}`}
        >
          WhatsApp
        </a>
      )}
    </span>
  );
}

/** Admin: who to call about this shop. Shows the details, with an Edit form. */
export default function ShopContactCard({ shopId, contact }) {
  const router = useRouter();
  const empty = !contact.name && !contact.phone && !contact.phone2 && !contact.notes;
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(contact);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/shops/${shopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactName: f.name, contactPhone: f.phone, contactPhone2: f.phone2, contactNotes: f.notes }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setError(json?.error || "Couldn’t save. Please try again.");
    setF(json.shop.contact); // the numbers come back tidied, e.g. "+91 98765 43210"
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form onSubmit={save} className={`${card} space-y-4`}>
        <h2 className="font-semibold">Owner contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Contact name</span>
            <input value={f.name} onChange={set("name")} maxLength={80} placeholder="e.g. Ramesh Sharma (owner)" autoComplete="off" className={`${input} mt-1`} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Mobile number</span>
            <input value={f.phone} onChange={set("phone")} type="tel" inputMode="tel" maxLength={20} placeholder="98765 43210" autoComplete="off" className={`${input} mt-1`} />
            <span className="mt-1 block text-xs text-muted">10 digits. WhatsApp works for Indian mobiles.</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Second number <span className="font-normal text-muted">(optional)</span></span>
            <input value={f.phone2} onChange={set("phone2")} type="tel" inputMode="tel" maxLength={20} placeholder="Manager or shop landline" autoComplete="off" className={`${input} mt-1`} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Notes <span className="font-normal text-muted">(optional)</span></span>
            <textarea value={f.notes} onChange={set("notes")} maxLength={500} rows={2} placeholder="e.g. Call after 11 am. Closed on Tuesdays." className={`${input} mt-1`} />
          </label>
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setF(contact);
              setError("");
              setEditing(false);
            }}
            className={btnSecondary}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <section className={`${card} space-y-3`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">Owner contact</h2>
          <p className="text-xs text-muted">Only you can see this</p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className={`${btnSecondary} ml-auto shrink-0 px-3 py-1.5`}>
          {empty ? "+ Add" : "Edit"}
        </button>
      </div>
      {empty ? (
        <p className="text-sm text-muted">No phone number yet. Add the owner’s name and mobile so you can call them when needed.</p>
      ) : (
        <div className="space-y-3">
          {contact.name && <p className="text-lg font-semibold">{contact.name}</p>}
          {[
            ["Mobile", contact.phone],
            ["Second number", contact.phone2],
          ]
            .filter(([, v]) => v)
            .map(([label, v]) => (
              <div key={label} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted">{label}</p>
                  <a href={telHref(v)} className="font-medium tabular-nums hover:underline">
                    {v}
                  </a>
                </div>
                <PhoneActions phone={v} />
              </div>
            ))}
          {contact.notes && <p className="rounded-xl bg-stone-50 p-3 text-sm whitespace-pre-line text-stone-700">{contact.notes}</p>}
        </div>
      )}
    </section>
  );
}
