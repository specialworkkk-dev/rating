"use client";

import { useState } from "react";
import { ChartEmptyIllustration } from "./illustrations";
import { card } from "./ui";

// Validated pair (dataviz validator: CVD ΔE 21.6, all checks pass on white).
const HAPPY = "#2a78d6";
const UNHAPPY = "#e34948";

const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });
const parse = (d) => new Date(`${d}T00:00:00Z`);

/** Clean axis maximum and step: 1, 2 or 5 × 10^k, at most 4 intervals. */
function niceScale(max) {
  if (max <= 4) return { top: Math.max(max, 1), step: 1 };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw);
  return { top: Math.ceil(max / step) * step, step };
}

export default function ActivityChart({ series, title }) {
  const [hover, setHover] = useState(null);
  const [table, setTable] = useState(false);

  const totals = series.reduce(
    (t, d) => ({ happy: t.happy + d.happy, unhappy: t.unhappy + d.unhappy, scans: t.scans + d.scans }),
    { happy: 0, unhappy: 0, scans: 0 }
  );
  const max = Math.max(...series.map((d) => d.ratings));
  const { top, step } = niceScale(max);
  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  const short = series.length <= 7;
  const labelEvery = short ? 1 : Math.ceil(series.length / 6);
  const active = hover == null ? null : series[hover];

  return (
    <section className={card}>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <div>
          <h2 className="font-semibold">Daily ratings</h2>
          <p className="text-sm text-muted">{title}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600" aria-label="Legend">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: HAPPY }} /> Happy (4–5★)
            <span className="font-semibold text-ink tabular-nums">{totals.happy}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: UNHAPPY }} /> Unhappy (1–3★)
            <span className="font-semibold text-ink tabular-nums">{totals.unhappy}</span>
          </span>
        </div>
      </div>

      {max === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <ChartEmptyIllustration />
          <p className="mt-3 font-medium">No ratings in this period yet</p>
          <p className="mt-1 text-sm text-muted">Each day’s ratings will appear here as bars.</p>
        </div>
      ) : (
        <div className="mt-6 flex gap-2">
          {/* Y axis */}
          <div className="relative h-48 w-6 shrink-0 text-right text-[11px] text-muted tabular-nums">
            {ticks.map((t) => (
              <span key={t} className="absolute right-0 translate-y-1/2 leading-none" style={{ bottom: `${(t / top) * 100}%` }}>
                {t}
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
            </div>
            {/* Columns */}
            <div className="relative flex h-48 items-end" onMouseLeave={() => setHover(null)}>
              {series.map((d, i) => {
                const hH = (d.happy / top) * 100;
                const uH = (d.unhappy / top) * 100;
                const label = `${dayFmt.format(parse(d.date))}: ${d.ratings} ratings, ${d.happy} happy, ${d.unhappy} unhappy, ${d.scans} scans`;
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
                    <span className="relative flex w-[60%] max-w-6 flex-col justify-end gap-0.5" style={{ height: `${hH + uH}%` }}>
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
                  {i % labelEvery === 0 || i === series.length - 1
                    ? short
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
                <p className="font-semibold">{dayFmt.format(parse(active.date))}</p>
                <p className="mt-1.5 flex items-center gap-1.5">
                  <span className="size-2 rounded-sm" style={{ backgroundColor: HAPPY }} /> Happy
                  <span className="ml-auto tabular-nums">{active.happy}</span>
                </p>
                <p className="mt-0.5 flex items-center gap-1.5">
                  <span className="size-2 rounded-sm" style={{ backgroundColor: UNHAPPY }} /> Unhappy
                  <span className="ml-auto tabular-nums">{active.unhappy}</span>
                </p>
                <p className="mt-1.5 flex border-t border-white/15 pt-1.5 text-stone-300">
                  Scans <span className="ml-auto tabular-nums">{active.scans}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {max > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          <button type="button" onClick={() => setTable((v) => !v)} className="text-sm font-medium text-stone-600 hover:text-ink">
            {table ? "Hide table" : "Show as table"}
          </button>
          {table && (
            <div className="mt-3 max-h-64 overflow-auto">
              <table className="w-full text-sm tabular-nums">
                <thead className="sticky top-0 bg-white text-left text-xs text-muted">
                  <tr>
                    <th className="py-1.5 font-medium">Day</th>
                    <th className="py-1.5 text-right font-medium">Scans</th>
                    <th className="py-1.5 text-right font-medium">Happy</th>
                    <th className="py-1.5 text-right font-medium">Unhappy</th>
                    <th className="py-1.5 text-right font-medium">To Google</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {[...series].reverse().map((d) => (
                    <tr key={d.date}>
                      <td className="py-1.5">{dayFmt.format(parse(d.date))}</td>
                      <td className="py-1.5 text-right">{d.scans}</td>
                      <td className="py-1.5 text-right">{d.happy}</td>
                      <td className="py-1.5 text-right">{d.unhappy}</td>
                      <td className="py-1.5 text-right">{d.google}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
