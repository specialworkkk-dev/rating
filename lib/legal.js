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

// Version 2 adds the RBT token section; it only applies once owners are to be
// told (NEXT_PUBLIC_TOKEN_TERMS=on), and then every owner is asked to agree again.
export const TOKEN_TERMS = process.env.NEXT_PUBLIC_TOKEN_TERMS === "on";
export const TERMS_VERSION = TOKEN_TERMS ? 2 : 1;

/** Whether a shop's owner has agreed to the current Terms and the fair-review rules. */
export const hasAgreedToTerms = (shop) => Boolean(shop?.rulesAcceptedAt) && shop?.termsVersion === TERMS_VERSION;
