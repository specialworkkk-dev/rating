// Review Booster service worker for the owner/admin app (/app/...).
//
// Opens instantly: an app page is shown from the copy saved last time, and
// at the same moment a fresh copy is fetched. When it arrives the page is
// told to update its figures (or to reload, after a new site version or a
// logout). Login/logout wipe the saved copies. Without internet, the saved
// copy (or a friendly offline page) is shown.
const CACHE = "rb-shell-v3";
const PAGES = "rb-pages-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== PAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Messages waiting for a page that hasn't started listening yet.
const pending = new Map();
function deliver(clientId, msg) {
  if (!clientId) return;
  pending.set(clientId, msg);
  self.clients.get(clientId).then((c) => c && c.postMessage(msg));
}

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "rb-hello" && event.source) {
    const msg = pending.get(event.source.id);
    if (msg) {
      pending.delete(event.source.id);
      event.source.postMessage(msg);
    }
  } else if (type === "rb-clear") {
    event.waitUntil(caches.delete(PAGES));
  }
});

const pageKey = (url) => {
  const u = new URL(url);
  u.searchParams.delete("source"); // the installed app's start link
  return u.origin + u.pathname + u.search;
};
const buildOf = (html) => (html.match(/<meta name="rb-build" content="([^"]*)"/) || [])[1] || "";

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return; // only page loads
  const url = new URL(req.url);
  const appPage = url.pathname.startsWith("/app/") && !url.pathname.startsWith("/app/login");
  if (!appPage) {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(PAGES);
      const key = pageKey(req.url);
      const saved = await cache.match(key);
      const fresh = fetch(req).then(async (res) => {
        const html = (res.headers.get("content-type") || "").includes("text/html");
        if (res.ok && !res.redirected && res.type === "basic" && html) await cache.put(key, res.clone());
        else if (res.redirected || res.status === 401 || res.status === 403) await cache.delete(key);
        return res;
      });

      if (!saved) return fresh.catch(async () => (await cache.match(key)) || caches.match(OFFLINE_URL));

      // Show the saved copy now; update the page when the fresh one arrives.
      // (Keep a copy to compare: the browser reads the one we hand it.)
      const savedCopy = saved.clone();
      const clientId = event.resultingClientId;
      event.waitUntil(
        fresh
          .then(async (res) => {
            if (!res.ok || res.redirected) return deliver(clientId, { type: "rb-reload" }); // e.g. logged out
            const [a, b] = await Promise.all([savedCopy.text(), res.clone().text()]);
            deliver(clientId, { type: buildOf(a) !== buildOf(b) ? "rb-reload" : "rb-refresh" });
          })
          .catch(() => {})
      );
      return saved;
    })()
  );
});
