// Phone numbers for shop contacts (Indian numbers first). Safe in the browser.

/**
 * Tidy a typed number. Returns { value } (display form) or { error }.
 * Indian mobiles become "+91 98765 43210"; other numbers (landlines with STD
 * code, foreign numbers) are kept as digits, with + if given.
 */
export function cleanPhone(raw) {
  const s = String(raw || "").trim();
  if (!s) return { value: "" };
  if (!/^[+\d][\d\s\-()./]*$/.test(s)) return { error: "Use only digits, spaces, + and -" };
  let digits = s.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) digits = digits.slice(2);
  // A number starting with 0 may be a mobile or a landline with its STD code
  // (e.g. 079…); both dial fine as typed, so it is kept as it is.
  if (digits.length === 10 && /^[6-9]/.test(digits)) return { value: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` };
  if (digits.length < 8 || digits.length > 15) return { error: "Enter a 10-digit mobile number (or a full landline with its STD code)" };
  return { value: s.startsWith("+") ? `+${digits}` : digits };
}

/** "tel:" link for a cleaned number. */
export const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

/** Whether a cleaned number is an Indian mobile (so WhatsApp makes sense). */
export const isIndianMobile = (phone) => /^\+91 [6-9]\d{4} \d{5}$/.test(String(phone || ""));

/** Digits only, for searching ("98765" finds "+91 98765 43210"). */
export const phoneDigits = (phone) => String(phone || "").replace(/\D/g, "");
