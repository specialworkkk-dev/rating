"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SERVICES } from "@/lib/servicePlans";
import { btnPrimary, btnSecondary, smallInputClass as input } from "./ui";

/** "Change plan": pick a plan (fills in its usual price and limit), then adjust. */
export default function ServicePlanEditor({ serviceId, setting }) {
  const service = SERVICES[serviceId];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState(setting.plan);
  const [cost, setCost] = useState(String(setting.cost));
  const [limit, setLimit] = useState(String(setting.limit));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function choose(id) {
    const p = service.plans.find((x) => x.id === id);
    setPlan(id);
    setCost(String(p.cost));
    setLimit(String(p.limit));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, cost: Number(cost), limit: Number(limit) }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setError(json?.error || "Couldn’t save");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btnSecondary}>
        Change plan
      </button>
    );
  }

  return (
    <form onSubmit={save} className="w-full space-y-4 rounded-xl bg-stone-50 p-4">
      <fieldset>
        <legend className="text-sm font-semibold">Which {service.name} plan are you on?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {service.plans.map((p) => (
            <label
              key={p.id}
              className={`cursor-pointer rounded-xl border bg-white p-3 text-sm ${
                plan === p.id ? "border-ink ring-1 ring-ink" : "border-stone-300"
              }`}
            >
              <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => choose(p.id)} className="sr-only" />
              <span className="flex items-center gap-2 font-semibold">
                {p.label}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${p.free ? "bg-emerald-100 text-emerald-800" : "bg-violet-100 text-violet-800"}`}>
                  {p.free ? "Free" : "Paid"}
                </span>
              </span>
              <span className="mt-1 block text-xs text-muted">{p.note}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-4">
        <label className="block">
          <span className="text-xs font-medium text-muted">Monthly cost (from your bill)</span>
          <span className="mt-1 flex items-center rounded-lg border border-stone-300 bg-white">
            <span className="pl-3 text-sm text-muted">₹</span>
            <input type="number" min={0} step={1} inputMode="numeric" required value={cost} onChange={(e) => setCost(e.target.value)} className="w-28 bg-transparent px-2 py-2 text-sm tabular-nums outline-none" />
          </span>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Limit ({service.unit})</span>
          <input type="number" min={1} step={1} inputMode="numeric" required value={limit} onChange={(e) => setLimit(e.target.value)} className={`${input} mt-1 w-40 tabular-nums`} />
        </label>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
