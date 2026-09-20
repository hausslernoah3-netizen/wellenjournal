// Wellenjournal - Service Worker
// Huelle aus dem Cache, Daten bevorzugt vom Netz mit Rueckfall auf den letzten Stand.
const HUELLE = "wj-huelle-v9";
const DATEN = "wj-daten-v9";
const HUELLE_DATEIEN = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(HUELLE).then(c => c.addAll(HUELLE_DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![HUELLE, DATEN].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const istDaten = url.pathname.endsWith("data.json") || url.pathname.includes("/charts/");
  if (istDaten) {
    // Netz zuerst, Cache als Rueckfall
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(DATEN).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request)));
  } else {
    // Huelle: Cache zuerst, Netz aktualisiert im Hintergrund
    e.respondWith(caches.match(e.request).then(hit => {
      const netz = fetch(e.request).then(r => { const c = r.clone(); caches.open(HUELLE).then(x => x.put(e.request, c)); return r; }).catch(() => hit);
      return hit || netz;
    }));
  }
});
