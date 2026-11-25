import mongoose from "mongoose";
import { bad } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import { getTotals, recomputeMonths, ROLLUP_VERSION } from "@/lib/totals";
import Feedback from "@/models/Feedback";
import Shop from "@/models/Shop";
import ShopMonth from "@/models/ShopMonth";
import ShopTotals from "@/models/ShopTotals";

// A copy of a shop's data as a spreadsheet file (CSV opens in Excel and
// Google Sheets), e.g. for an owner who asks before their shop is deleted.
//   ?what=feedback  every feedback message
//   ?what=figures   month-by-month figures plus an all-time row

const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** One CSV cell. Text that starts like a formula is neutralised so a spreadsheet never runs it. */
function cell(v) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const csv = (rows) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
const avg = (stars, n) => (n ? (stars / n).toFixed(1) : "");

export async function GET(req, { params }) {
  const { error } = await requireApiRole("admin");
  if (error) return error;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad("Invalid shop id");
  const shop = await Shop.findById(id).select("slug name").lean();
  if (!shop) return bad("Shop not found", 404);
  const what = new URL(req.url).searchParams.get("what") === "figures" ? "figures" : "feedback";

  let rows;
  if (what === "feedback") {
    const list = await Feedback.find({ shopId: shop._id }).sort({ createdAt: -1 }).lean();
    rows = [
      ["Date", "Stars", "Name", "Phone", "Message", "Read"],
      ...list.map((f) => [dateTime.format(f.createdAt), f.stars ?? "", f.name || "", f.phone || "", f.message, f.isRead ? "Yes" : "No"]),
    ];
  } else {
    const t = await ShopTotals.findById(shop._id).select("monthsReady").lean();
    if (t?.monthsReady !== ROLLUP_VERSION) await recomputeMonths(shop._id);
    const [months, all] = await Promise.all([ShopMonth.find({ shopId: shop._id }).sort({ month: 1 }).lean(), getTotals(shop._id)]);
    const starSum = [1, 2, 3, 4, 5].reduce((a, s) => a + s * (all.stars?.[s] || 0), 0);
    rows = [
      ["Month", "Scans", "Ratings", "Happy (4-5 stars)", "Unhappy (1-3 stars)", "Average stars", "Went to Google after rating", "Went to Google directly"],
      ...months.map((m) => [m.month, m.scans, m.happy + m.unhappy, m.happy, m.unhappy, avg(m.stars, m.happy + m.unhappy), m.google, m.direct || 0]),
      [
        "All time",
        all.scans,
        all.ratings,
        (all.stars?.[4] || 0) + (all.stars?.[5] || 0),
        (all.stars?.[1] || 0) + (all.stars?.[2] || 0) + (all.stars?.[3] || 0),
        avg(starSum, all.ratings),
        all.google,
        all.direct || 0,
      ],
    ];
  }

  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${shop.slug}-${what}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
