// What a backup contains. Shared by the download route and scripts/restore.mjs.
// Relative-import safe (no "@/").

/** Collections in every backup: shops, logins, feedback, figures, settings. */
export const ESSENTIAL = [
  "shops",
  "users",
  "feedbacks",
  "shoptotals",
  "shopdays",
  "shopmonths",
  "servicesettings",
  "appsettings",
  "tokenburns",
  // Offers (premium)
  "followers",
  "offers",
  "offerusages",
  "whatsappoptins",
];
/** Raw records (kept ~3 months), only in a full backup. */
export const RAW = ["ratings", "scans", "directtaps"];

export const collectionsFor = (type) => (type === "full" ? [...ESSENTIAL, ...RAW] : ESSENTIAL);
