// Validation for admin shop create / edit payloads.
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACE_ID_RE = /^[A-Za-z0-9_-]{10,300}$/;

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseDate(v) {
  if (v === null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * @param body   raw request JSON
 * @param partial  true for PATCH (only validate fields that are present)
 * @returns {{ data: object } | { error: string }}
 */
export function parseShopInput(body, { partial = false } = {}) {
  const data = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
  const str = (k) => (typeof body[k] === "string" ? body[k].trim() : "");

  if (!partial || has("name")) {
    const name = str("name");
    if (name.length < 2 || name.length > 80) return { error: "Shop name must be 2–80 characters" };
    data.name = name;
  }

  if (!partial || has("slug")) {
    const slug = str("slug").toLowerCase() || slugify(body.name);
    if (slug.length < 3 || slug.length > 60 || !SLUG_RE.test(slug)) {
      return { error: "Link name must be 3–60 lowercase letters, numbers and dashes" };
    }
    data.slug = slug;
  }

  if (has("googlePlaceId")) {
    const v = str("googlePlaceId");
    if (v && !PLACE_ID_RE.test(v)) return { error: "That doesn’t look like a Google Place ID" };
    data.googlePlaceId = v;
  }

  if (has("logoUrl")) {
    const v = str("logoUrl");
    if (v) {
      try {
        if (new URL(v).protocol !== "https:") throw new Error();
      } catch {
        return { error: "Logo URL must be an https:// link" };
      }
    }
    data.logoUrl = v;
  }

  if (has("alertEmail")) {
    const v = str("alertEmail").toLowerCase();
    if (v && !EMAIL_RE.test(v)) return { error: "Alert email is not valid" };
    data.alertEmail = v;
  }

  if (has("status")) {
    if (!["trial", "active", "paused"].includes(body.status)) return { error: "Invalid status" };
    data.status = body.status;
  }

  if (has("plan")) {
    if (!["basic", "premium"].includes(body.plan)) return { error: "Invalid plan" };
    data.plan = body.plan;
  }

  for (const k of ["trialEndsAt", "paidUntil"]) {
    if (has(k)) {
      const d = parseDate(body[k]);
      if (d === undefined) return { error: `Invalid date for ${k}` };
      data[k] = d;
    }
  }

  return { data };
}

export function isValidEmail(v) {
  return typeof v === "string" && EMAIL_RE.test(v.trim());
}

/** Add whole calendar months to a date. */
export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0); // e.g. 31 Jan + 1 month → 28/29 Feb
  return d;
}

/** Plain JSON-safe shape for the admin UI. */
export function adminShop(shop, owner) {
  return {
    id: String(shop._id),
    name: shop.name,
    slug: shop.slug,
    logoUrl: shop.logoUrl || "",
    googlePlaceId: shop.googlePlaceId || "",
    alertEmail: shop.alertEmail || "",
    status: shop.status,
    plan: shop.plan,
    trialEndsAt: shop.trialEndsAt ? shop.trialEndsAt.toISOString() : null,
    paidUntil: shop.paidUntil ? shop.paidUntil.toISOString() : null,
    createdAt: shop.createdAt ? shop.createdAt.toISOString() : null,
    owner: owner ? { id: String(owner._id), name: owner.name || "", email: owner.email } : null,
  };
}
