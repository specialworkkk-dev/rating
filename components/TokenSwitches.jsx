"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtFull } from "@/lib/format";
import { btnPrimary, btnSecondary, card } from "./ui";

const SWITCHES = [
  {
    key: "ownersTold",
    title: "Owners told (token section in the Terms)",
    on: "The Terms show the “Review Booster Token” section. Owners who agreed to the old Terms are asked to agree again on their dashboard.",
    off: "The Terms have no token section. Needed before the real network.",
    confirmOn: "Turn on? Every shop owner will be asked to agree to the updated Terms the next time they open their dashboard.",
    confirmOff: "Turn off? The token section disappears from the Terms. Owners who already agreed keep their agreement on record.",
  },
  {
    key: "legalOk",
    title: "Lawyer & CA approved",
    on: "Real-network burns are allowed (with “Owners told” also on).",
    off: "Real-network burns are blocked. The test network works either way.",
    typed: "APPROVED",
    confirmOn: "Only switch this on when you have your lawyer’s and CA’s approval in writing. It is recorded with your email and the time.",
    confirmOff: "Turn off? Real-network burns stop until it is switched on again.",
  },
  {
    key: "burnsPaused",
    title: "Pause daily burns",
    on: "Burns are paused: nothing is burned until you switch this off. Paused days are burned afterwards (up to 7 per night).",
    off: "Burns run every night at about 3 AM.",
    confirmOn: "Pause all burns now?",
    confirmOff: "Resume burns? Days missed while paused are burned over the next nights.",
  },
];

function Toggle({ on, busy, onClick, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={busy}
      onClick={onClick}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? "bg-emerald-600" : "bg-stone-300"}`}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

/** Admin → Token: the three switches, each change confirmed and recorded. */
export default function TokenSwitches({ settings, vesting }) {
  const router = useRouter();
  const [asking, setAsking] = useState(null); // { key, on }
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function apply(key, on) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/token/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, on, confirm: typed.trim() }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setError(json?.error || "Couldn’t change the switch");
    setAsking(null);
    setTyped("");
    router.refresh();
  }

  return (
    <section className={`${card} space-y-1`}>
      <h2 className="font-semibold">Switches</h2>
      <p className="pb-2 text-xs text-muted">Changes apply at once, with no redeploy. Each change is recorded with who made it and when.</p>
      <ul className="divide-y divide-stone-100">
        {SWITCHES.map((s) => {
          const state = settings[s.key];
          const open = asking?.key === s.key;
          const needsTyping = s.typed && asking?.on;
          return (
            <li key={s.key} className="py-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-muted">{state.on ? s.on : s.off}</p>
                  {state.at && (
                    <p className="mt-0.5 text-xs text-muted">
                      {state.on ? "Turned on" : "Turned off"} {fmtFull(state.at)}
                      {state.by ? ` by ${state.by}` : ""}
                    </p>
                  )}
                </div>
                <Toggle
                  on={state.on}
                  busy={busy}
                  label={s.title}
                  onClick={() => {
                    setError("");
                    setTyped("");
                    setAsking({ key: s.key, on: !state.on });
                  }}
                />
              </div>
              {open && (
                <div className="mt-3 space-y-3 rounded-xl bg-amber-50 p-3 text-sm ring-1 ring-amber-200">
                  <p>{asking.on ? s.confirmOn : s.confirmOff}</p>
                  {needsTyping && (
                    <label className="block">
                      <span className="text-xs font-medium">
                        Type <b>{s.typed}</b> to confirm
                      </span>
                      <input
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        autoComplete="off"
                        className="mt-1 w-full max-w-xs rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-amber-500"
                      />
                    </label>
                  )}
                  {error && <p className="text-red-700">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy || (needsTyping && typed.trim() !== s.typed)}
                      onClick={() => apply(s.key, asking.on)}
                      className={btnPrimary}
                    >
                      {busy ? "Saving…" : asking.on ? "Turn on" : "Turn off"}
                    </button>
                    <button type="button" onClick={() => setAsking(null)} className={btnSecondary}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
        <li className="py-3">
          <p className="font-medium">
            Team 50% lock <span className="text-xs font-normal text-muted">· fixed in the contract</span>
          </p>
          <p className="text-sm text-muted">
            {vesting
              ? `Nothing unlocks before ${vesting.cliff}; then it unlocks steadily until ${vesting.end}. `
              : "Set before launch in token/.env (VEST_CLIFF_MONTHS, VEST_MONTHS). "}
            It can’t be switched or changed after launch, by anyone, which is what lets buyers trust it.
          </p>
        </li>
      </ul>
    </section>
  );
}
