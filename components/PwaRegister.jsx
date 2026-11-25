"use client";

import { useEffect } from "react";

/** Registers the service worker (app pages only: login, dashboard, admin). */
export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
