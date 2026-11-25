"use client";

import { useEffect, useState } from "react";
import { fmtNum } from "@/lib/format";
import Pagination from "./Pagination";

const PERIODS = [
  { key: "1m", label: "1 month" },
  { key: "3m", label: "3 months" },
  { key: "1y", label: "1 year" },
  { key: "custom", label: "Custom" },
];

const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dayShortFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const monthShortFmt = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const parse = (k) => new Date(k.length === 7 ? `${k}-01T00:00:00Z` : `${k}T00:00:00Z`);

/** Today's date in India as "YYYY-MM-DD" (for the date pickers' max). */
function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function Toggle({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600 select-none">
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), onChange(!checked))}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-stone-900" : "bg-stone-300"}`}
      >
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"}`} />
      </span>
      {children}
    </label>
  );
}

/**
 * Detailed figures: choose a period (1 month / 3 months / 1 year / custom),
 * group by day or month, hide empty days (default), show a totals row, paged.
 */
export default function ActivityTable() {
  const today = todayIST();
  const [period, setPeriod] = useState("1m");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(today);
  const [applied, setApplied] = useState(null); // custom range in use
  const [group, setGroup] = useState("day");
  const [showEmpty, setShowEmpty] = useState(false);
  const [showTotals, setShowTotals] = useState(true);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const waitingForCustom = period === "custom" && !applied;

  useEffect(() => {
    if (waitingForCustom) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ period, group, page: String(page), per: String(per) });
      if (period === "custom") {
        params.set("from", applied.from);
        params.set("to", applied.to);
      }
      if (showEmpty) params.set("empty", "1");
      const res = await fetch(`/api/dashboard/activity?${params}`).catch(() => null);
      const json = res ? await res.json().catch(() => null) : null;
      if (cancelled) return;
      setLoading(false);
      if (!res?.ok) return setError(json?.error || "Couldn’t load figures. Please try again.");
      setData(json);
    })();
    return () => {
      cancelled = true;
    };
  }, [period, applied, group, showEmpty, page, per, waitingForCustom]);

  const reset = (fn) => {
    fn();
    setPage(1);
  };

  const customInvalid = !from || !to || from > to || to > today;
  const label = (k) => (k.length === 7 ? monthFmt.format(parse(k)) : dayFmt.format(parse(k)));
  const shortLabel = (k) => (k.length === 7 ? monthShortFmt.format(parse(k)) : dayShortFmt.format(parse(k)));
  const rangeText = data ? `${shortFmt.format(parse(data.from))} – ${shortFmt.format(parse(data.to))}` : "";
  const periodName = data
    ? data.period === "custom"
      ? `${fmtNum(data.days)} ${data.days === 1 ? "day" : "days"}`
      : { "1m": "Last 30 days", "3m": "Last 90 days", "1y": "Last 365 days" }[data.period]
    : "";
  const unit = group === "month" ? "months" : "days";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap rounded-xl bg-stone-100 p-1 text-sm" role="tablist" aria-label="Period">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={period === p.key}
              onClick={() => reset(() => setPeriod(p.key))}
              className={`rounded-lg px-3 py-1.5 ${period === p.key ? "bg-white font-medium shadow-sm" : "text-stone-600 hover:text-ink"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-xl bg-stone-100 p-1 text-sm" role="tablist" aria-label="Group by">
          {[
            ["day", "By day"],
            ["month", "By month"],
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={group === k}
              onClick={() => reset(() => setGroup(k))}
              className={`rounded-lg px-3 py-1.5 ${group === k ? "bg-white font-medium shadow-sm" : "text-stone-600 hover:text-ink"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-4">
          <Toggle checked={showEmpty} onChange={(v) => reset(() => setShowEmpty(v))}>
            Show empty {unit}
          </Toggle>
          <Toggle checked={showTotals} onChange={setShowTotals}>
            Totals row
          </Toggle>
        </div>
      </div>

      {period === "custom" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!customInvalid) reset(() => setApplied({ from, to }));
          }}
          className="flex flex-wrap items-end gap-3 rounded-xl bg-stone-50 p-3"
        >
          <label className="text-sm">
            <span className="block text-xs font-medium text-muted">From</span>
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-stone-900"
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs font-medium text-muted">To</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-stone-900"
            />
          </label>
          <button
            type="submit"
            disabled={customInvalid}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Apply
          </button>
          <p className="w-full text-xs text-muted">Up to 3 years. Dates are in Indian time.</p>
        </form>
      )}

      {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}

      {waitingForCustom ? (
        <p className="py-6 text-center text-sm text-muted">Pick a From and To date, then press Apply.</p>
      ) : data ? (
        <div className={`space-y-3 transition-opacity ${loading ? "opacity-50" : ""}`} aria-busy={loading}>
          {/* Totals sentence */}
          <p className="text-sm">
            <span className="font-semibold">{periodName} total</span>
            <span className="text-muted"> ({rangeText})</span>
            <span className="font-semibold">:</span> {fmtNum(data.totals.scans)} scans · {fmtNum(data.totals.happy)} happy ·{" "}
            {fmtNum(data.totals.unhappy)} unhappy · {fmtNum(data.totals.google)} to Google
          </p>

          {data.total === 0 ? (
            <p className="rounded-xl bg-stone-50 py-8 text-center text-sm text-muted">
              No activity in this period.
              {!showEmpty && data.hiddenEmpty > 0 && " Turn on “Show empty " + unit + "” to list every " + (group === "month" ? "month" : "day") + "."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl ring-1 ring-stone-200">
              <table className="w-full text-sm tabular-nums">
                <thead className="bg-stone-50 text-left text-[11px] text-muted sm:text-xs">
                  <tr>
                    <th className="px-2 py-2.5 sm:px-4 font-medium">{group === "month" ? "Month" : "Day"}</th>
                    <th className="px-2 py-2.5 sm:px-4 text-right font-medium">Scans</th>
                    <th className="px-2 py-2.5 sm:px-4 text-right font-medium">Happy</th>
                    <th className="px-2 py-2.5 sm:px-4 text-right font-medium">Unhappy</th>
                    <th className="px-2 py-2.5 sm:px-4 text-right font-medium">
                      <span className="sm:hidden">Google</span>
                      <span className="hidden sm:inline">To Google</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.rows.map((r) => {
                    const blank = !r.scans && !r.happy && !r.unhappy && !r.google;
                    return (
                      <tr key={r.key} className={blank ? "text-stone-400" : ""}>
                        <td className="px-2.5 py-2.5 whitespace-nowrap sm:px-4">
                          <span className="sm:hidden">{shortLabel(r.key)}</span>
                          <span className="hidden sm:inline">{label(r.key)}</span>
                        </td>
                        <td className="px-2 py-2.5 sm:px-4 text-right">{fmtNum(r.scans)}</td>
                        <td className="px-2 py-2.5 sm:px-4 text-right">{fmtNum(r.happy)}</td>
                        <td className="px-2 py-2.5 sm:px-4 text-right">{fmtNum(r.unhappy)}</td>
                        <td className="px-2 py-2.5 sm:px-4 text-right">{fmtNum(r.google)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {showTotals && (
                  <tfoot className="border-t-2 border-stone-200 bg-stone-50 font-semibold">
                    <tr>
                      <td className="px-2 py-2.5 sm:px-4">
                        Total<span className="hidden sm:inline"> ({periodName.toLowerCase()})</span>
                      </td>
                      <td className="px-2 py-2.5 sm:px-4 text-right">{fmtNum(data.totals.scans)}</td>
                      <td className="px-2 py-2.5 sm:px-4 text-right">{fmtNum(data.totals.happy)}</td>
                      <td className="px-2 py-2.5 sm:px-4 text-right">{fmtNum(data.totals.unhappy)}</td>
                      <td className="px-2 py-2.5 sm:px-4 text-right">{fmtNum(data.totals.google)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {!showEmpty && data.hiddenEmpty > 0 && data.total > 0 && (
            <p className="text-xs text-muted">
              {fmtNum(data.hiddenEmpty)} {group === "month" ? (data.hiddenEmpty === 1 ? "month" : "months") : data.hiddenEmpty === 1 ? "day" : "days"} with no
              activity hidden.
            </p>
          )}

          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            pageSize={per}
            noun={group === "month" ? (data.total === 1 ? "month" : "months") : data.total === 1 ? "day" : "days"}
            onChange={setPage}
            onPageSizeChange={(n) => reset(() => setPer(n))}
          />
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted">Loading…</p>
      )}
    </div>
  );
}
