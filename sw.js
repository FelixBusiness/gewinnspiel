/* Service Worker: legt alle Dateien beim ersten Aufruf ab, danach läuft die App komplett ohne Internet. */
const VERSION = "mppm-gewinnspiel-v7";   // bei Änderungen an den Dateien hochzählen, dann aktualisiert sich das iPad beim nächsten Online-Start
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./xlsx.mini.min.js",
  "./inter-latin-wght-normal.woff2",
  "./inter-latin-ext-wght-normal.woff2",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./logo.png"
];
const OPTIONAL = [];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // immer frisch vom Server holen, nie aus dem Zwischenspeicher des Browsers
    await Promise.all(FILES.map(async f => {
      const r = await fetch(f, {cache: "reload"});
      if (!r.ok) throw new Error("Fehlt: " + f);
      await cache.put(f, r);
    }));
    for (const f of OPTIONAL){ try { const r = await fetch(f, {cache: "reload"}); if (r.ok) await cache.put(f, r); } catch(e){} }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, {ignoreSearch: true}) ||
                (req.mode === "navigate" ? await cache.match("./index.html") : null);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch(e){
      return new Response("", {status: 504, statusText: "Offline"});
    }
  })());
});
