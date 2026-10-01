/* Service Worker: legt alle Dateien beim ersten Aufruf ab, danach läuft die App komplett ohne Internet. */
const VERSION = "mppm-gewinnspiel-v1";   // bei Änderungen an den Dateien hochzählen, dann aktualisiert sich das iPad beim nächsten Online-Start
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./vendor/xlsx.mini.min.js",
  "./fonts/inter-latin-wght-normal.woff2",
  "./fonts/inter-latin-ext-wght-normal.woff2",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
const OPTIONAL = ["./logo.svg"]; // eigenes Logo, falls vorhanden

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(FILES);
    for (const f of OPTIONAL){ try { const r = await fetch(f, {cache: "no-store"}); if (r.ok) await cache.put(f, r); } catch(e){} }
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
