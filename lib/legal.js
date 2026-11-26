// Facts the Privacy Policy and Terms rely on, in one place.
import { BRAND } from "./brand.js";

export const LEGAL = {
  provider: BRAND.name,
  updated: "25 November 2026",
  // Public contact for privacy questions, deletion requests and complaints.
  // Set NEXT_PUBLIC_CONTACT_EMAIL in Vercel (then redeploy).
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  rawKeepMonths: 3,
  replyDays: 30,
  refundDays: 7,
};

// Terms versions. Version 2 adds the RBT token section; it applies while the
// admin's "Owners told" switch is on (Admin → Token), and then every owner who
// agreed to an older version is asked to agree again.
export const termsVersionFor = (tokenSectionOn) => (tokenSectionOn ? 2 : 1);

/** Whether a shop's owner has agreed to the fair-review rules and to Terms version `required` (or newer). */
export const hasAgreedToTerms = (shop, required = 1) => Boolean(shop?.rulesAcceptedAt) && (shop?.termsVersion || 0) >= required;
