"use client";

import { useState } from "react";
import { fmtNum } from "@/lib/format";
import { ChartEmptyIllustration } from "./illustrations";
import { card } from "./ui";
import { MoodLabel } from "./Mood";

// Validated pair (dataviz validator: CVD ΔE 21.6, all checks pass on white).
const HAPPY = "#2a78d6";
const UNHAPPY = "#e34948";

const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });
const monthLongFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const compactFmt = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
// Keys are "YYYY-MM-DD" for days and "YYYY-MM" for months.
const parse = (d) => new Date(d.length === 7 ? `${d}-01T00:00:00Z` : `${d}T00:00:00Z`);
// Axis ticks stay short: 1,500 → "1,500"; 25,000 → "25K"; 2,00,000 → "2L".
// One style per axis: if the top tick needs "K"/"L", every tick uses it.
const tickLabelFor = (top) => (n) => (top >= 10000 ? compactFmt.format(n) : fmtNum(n));

/** Clean axis maximum and step: 1, 2 or 5 × 10^k, at most 4 intervals. */
function niceScale(max) {
  if (max <= 4) return { top: Math.max(max, 1), step: 1 };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw);
  return { top: Math.ceil(max / step) * step, step };
}

/**
 * Ratings per day (or per month for long periods), stacked happy vs unhappy,
 * so one bar shows how many customers rated and how happy they were.
 */
export default function ActivityChart({ series, title, unit = "day", heading, showAverage = false }) {
  const monthly = unit === "month";
  const nameOf = (d) => (monthly ? monthLongFmt.format(parse(d.date)) : dayFmt.format(parse(d.date)));
  const [hover, setHover] = useState(null);

  const totals = series.reduce(
    (t, d) => ({ happy: t.happy + d.happy, unhappy: t.unhappy + d.unhappy, scans: t.scans + d.scans }),
    { happy: 0, unhappy: 0, scans: 0 }
  );
  const max = Math.max(...series.map((d) => d.ratings));
  const { top, step } = niceScale(max);
  // Average per day (or month) over the whole period, zero days included.
  const avg = series.length ? (totals.happy + totals.unhappy) / series.length : 0;
  const tickLabel = tickLabelFor(top);
  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  const short = !monthly && series.length <= 7;
  const labelEvery = short ? 1 : Math.ceil(series.length / 6);
  const active = hover == null ? null : series[hover];

  return (
    <section className={card}>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <div>
          <h2 className="font-semibold">{heading || (monthly ? "Monthly ratings" : "Daily ratings")}</h2>
          <p className="text-sm text-muted">{title}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600" aria-label="Legend">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: HAPPY }} /> <MoodLabel kind="happy">Happy (4–5★)</MoodLabel>
            <span className="font-semibold text-ink tabular-nums">{fmtNum(totals.happy)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: UNHAPPY }} /> <MoodLabel kind="unhappy">Unhappy (1–3★)</MoodLabel>
            <span className="font-semibold text-ink tabular-nums">{fmtNum(totals.unhappy)}</span>
          </span>
        </div>
      </div>

      {max === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <ChartEmptyIllustration />
          <p className="mt-3 font-medium">No ratings in this period yet</p>
          <p className="mt-1 text-sm text-muted">Each {monthly ? "month’s" : "day’s"} ratings will appear here as bars.</p>
        </div>
      ) : (
        <div className="mt-6 flex gap-2">
          {/* Y axis */}
          <div className="relative h-48 w-9 shrink-0 text-right text-[11px] text-muted tabular-nums">
            {ticks.map((t) => (
              <span key={t} className="absolute right-0 translate-y-1/2 leading-none" style={{ bottom: `${(t / top) * 100}%` }}>
                {tickLabel(t)}
              </span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            {/* Gridlines */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-48">
              {ticks.map((t) => (
                <span
                  key={t}
                  className={`absolute inset-x-0 border-t ${t === 0 ? "border-stone-300" : "border-dashed border-stone-200"}`}
                  style={{ bottom: `${(t / top) * 100}%` }}
                />
              ))}
              {/* Average reference line: was a day busier than normal? */}
              {showAverage && max > 0 && avg > 0 && (
                <span className="absolute inset-x-0 z-[1] border-t-2 border-dashed border-stone-500/70" style={{ bottom: `${(avg / top) * 100}%` }}>
                  <span className="absolute left-0 bottom-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-stone-600 shadow-sm ring-1 ring-stone-200">
                    Avg {fmtNum(Math.round(avg))}/{monthly ? "month" : "day"}
                  </span>
                </span>
              )}
            </div>
            {/* Columns */}
            <div className="relative flex h-48 items-end" onMouseLeave={() => setHover(null)}>
              {series.map((d, i) => {
                const hH = (d.happy / top) * 100;
                const uH = (d.unhappy / top) * 100;
                const label = `${nameOf(d)}: ${fmtNum(d.ratings)} ratings, ${fmtNum(d.happy)} happy, ${fmtNum(d.unhappy)} unhappy, ${fmtNum(d.scans)} scans`;
                return (
                  <button
                    key={d.date}
                    type="button"
                    aria-label={label}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
                  >
                    <span className={`absolute inset-0 rounded-md ${hover === i ? "bg-stone-100" : ""}`} />
                    {/* Stack: unhappy on top of happy, 2px surface gap, 4px rounded data-end */}
                    <span className="relative flex w-[70%] min-w-[3px] max-w-6 flex-col justify-end gap-0.5" style={{ height: `${hH + uH}%` }}>
                      {d.unhappy > 0 && (
                        <span className="w-full rounded-t" style={{ height: `${(uH / (hH + uH)) * 100}%`, backgroundColor: UNHAPPY, minHeight: 2 }} />
                      )}
                      {d.happy > 0 && (
                        <span className={`w-full ${d.unhappy ? "" : "rounded-t"}`} style={{ height: `${(hH / (hH + uH)) * 100}%`, backgroundColor: HAPPY, minHeight: 2 }} />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* X axis labels */}
            <div className="mt-2 flex text-[11px] text-muted">
              {series.map((d, i) => (
                <span key={d.date} className="flex-1 text-center whitespace-nowrap">
                  {/* Regular labels, plus the last one; skip a regular label that would crowd the last. */}
                  {(i % labelEvery === 0 && series.length - 1 - i >= labelEvery) || i === series.length - 1
                    ? monthly
                      ? monthFmt.format(parse(d.date))
                      : short
                        ? weekdayFmt.format(parse(d.date))
                        : dayFmt.format(parse(d.date))
                    : ""}
                </span>
              ))}
            </div>
            {/* Tooltip */}
            {active && (
              <div
                className="pointer-events-none absolute top-0 z-10 w-40 rounded-xl bg-stone-900 px-3 py-2.5 text-xs text-white shadow-lg"
                style={{
                  left: `${((hover + 0.5) / series.length) * 100}%`,
                  // Beside the hovered column, on the side with more room, so it never covers the bar.
                  transform: hover < series.length / 2 ? "translateX(14px)" : "translateX(calc(-100% - 14px))",
                }}
                role="status"
              >
                <p className="font-semibold">{nameOf(active)}</p>
                <p className="mt-1.5 flex items-center gap-1.5">
                  <span className="size-2 rounded-sm" style={{ backgroundColor: HAPPY }} /> <MoodLabel kind="happy" />
                  <span className="ml-auto tabular-nums">{fmtNum(active.happy)}</span>
                </p>
                <p className="mt-0.5 flex items-center gap-1.5">
                  <span className="size-2 rounded-sm" style={{ backgroundColor: UNHAPPY }} /> <MoodLabel kind="unhappy" />
                  <span className="ml-auto tabular-nums">{fmtNum(active.unhappy)}</span>
                </p>
                <p className="mt-1.5 flex border-t border-white/15 pt-1.5 text-stone-300">
                  Scans <span className="ml-auto tabular-nums">{fmtNum(active.scans)}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
}
