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

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

const istDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * "Just now", "12 min ago", "3 h ago" (today), "Yesterday, 9:30 pm" (the
 * previous calendar day in India), otherwise "24 Nov 2026".
 */
export function fmtRelative(date, now = new Date()) {
  const d = new Date(date);
  const mins = Math.floor((now - d) / 60000);
  const today = istDay.format(now);
  const day = istDay.format(d);
  if (day === today) {
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    return `${Math.floor(mins / 60)} h ago`;
  }
  const yesterday = istDay.format(new Date(now.getTime() - 864e5));
  if (day === yesterday) return `Yesterday, ${timeFmt.format(d)}`;
  return dateFmt.format(d);
}

/** Full date and time, for tooltips: "25 Nov 2026, 9:33 am". */
export function fmtFull(date) {
  const d = new Date(date);
  return `${dateFmt.format(d)}, ${timeFmt.format(d)}`;
}

/** WhatsApp chat link for an Indian mobile number, or null if it isn't one. */
export function whatsappLink(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length === 12 && digits.startsWith("91") ? `https://wa.me/${digits}` : null;
}
