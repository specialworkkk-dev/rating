"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for the app pages only (/app/...). Phones that
 * installed the app before the move still have a site-wide registration;
 * it is removed so customers' /r/... pages are never handled by the app.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const siteWide = `${location.origin}/`;
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.filter((r) => r.scope === siteWide).map((r) => r.unregister())))
      .catch(() => {})
      .finally(() => {
        navigator.serviceWorker.register("/sw.js", { scope: "/app/", updateViaCache: "none" }).catch(() => {});
      });
  }, []);
  return null;
}
