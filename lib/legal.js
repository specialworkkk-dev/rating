// Facts the Privacy Policy and Terms rely on, in one place.
// Bump TERMS_VERSION when the Terms change in a way owners must agree to again.
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

export const TERMS_VERSION = 1;

/** Whether a shop's owner has agreed to the current Terms and the fair-review rules. */
export const hasAgreedToTerms = (shop) => Boolean(shop?.rulesAcceptedAt) && shop?.termsVersion === TERMS_VERSION;
