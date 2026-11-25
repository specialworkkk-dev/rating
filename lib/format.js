// Number formatting that stays readable from 1 to crores.

/** 500000 → "5,00,000" (Indian digit grouping). */
export function fmtNum(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

/**
 * A share as text that never hides a real count: a few ratings out of lakhs
 * show "<1%" (not "0%"), and almost-all shows ">99%" (not "100%").
 */
export function fmtShare(count, total) {
  if (!total || !count) return "0%";
  const p = (count / total) * 100;
  if (p < 1) return "<1%";
  if (p > 99 && count < total) return ">99%";
  return `${Math.round(p)}%`;
}
