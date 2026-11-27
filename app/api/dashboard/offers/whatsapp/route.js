import { requireApiRole } from "@/lib/session";
import WhatsAppOptIn from "@/models/WhatsAppOptIn";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const cell = (v) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** The owner downloads their WhatsApp offers list (CSV) for a WhatsApp Business broadcast. */
export async function GET() {
  const { user, error } = await requireApiRole("owner");
  if (error) return error;
  const rows = await WhatsAppOptIn.find({ shopId: user.shopId }).sort({ createdAt: -1 }).lean();
  const csv =
    "﻿" +
    [["Name", "WhatsApp number", "Joined"], ...rows.map((r) => [r.name || "", r.phone, dateFmt.format(r.createdAt)])]
      .map((r) => r.map(cell).join(","))
      .join("\r\n") +
    "\r\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="whatsapp-offers-list.csv"',
      "Cache-Control": "no-store",
    },
  });
}
