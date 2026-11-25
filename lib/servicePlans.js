// Outside services and their plans. Safe to import in the browser.
// Prices and limits are approximate starting values; the admin can edit
// both to match the real bill.

export const SERVICES = {
  vercel: {
    name: "Vercel",
    role: "Website hosting",
    dashboard: "https://vercel.com/dashboard",
    usageHelp: "Vercel → your project → Usage",
    unit: "function calls / month",
    plans: [
      { id: "hobby", label: "Hobby", free: true, cost: 0, limit: 1_000_000, note: "Free. For non-commercial use only." },
      { id: "pro", label: "Pro", free: false, cost: 1_700, limit: 1_000_000, note: "About $20/month. Extra use above the included amount is billed." },
    ],
  },
  mongodb: {
    name: "MongoDB Atlas",
    role: "Database",
    dashboard: "https://cloud.mongodb.com",
    usageHelp: "Atlas → your cluster → Metrics",
    unit: "MB of storage",
    plans: [
      { id: "m0", label: "M0", free: true, cost: 0, limit: 512, note: "Free. 512 MB for the whole cluster." },
      { id: "flex", label: "Flex", free: false, cost: 2_500, limit: 5_120, note: "About $8–30/month depending on use. 5 GB." },
      { id: "m10", label: "M10", free: false, cost: 5_000, limit: 10_240, note: "About $57/month. Dedicated, 10 GB." },
    ],
  },
};

export const planOf = (serviceId, planId) => {
  const plans = SERVICES[serviceId].plans;
  return plans.find((p) => p.id === planId) || plans[0];
};

/** "ok" below 70%, "warning" from 70%, "critical" from 90%. */
export function usageLevel(percent) {
  if (percent >= 90) return "critical";
  if (percent >= 70) return "warning";
  return "ok";
}

export function fmtBytes(bytes) {
  const mb = bytes / 1048576;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 100) return `${Math.round(mb)} MB`;
  if (mb >= 10) return `${mb.toFixed(0)} MB`;
  return `${mb.toFixed(1)} MB`;
}
