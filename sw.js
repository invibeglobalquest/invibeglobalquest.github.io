// Çevrimdışı destek: önce ağ (her zaman güncel), ağ yavaş/yoksa önbellek.
// Firebase ve diğer sitelere giden isteklere dokunmaz.
const SURUM = "kv-2";
const KABUK = [
  "./", "index.html", "style.css", "ikonlar.js", "common.js", "app.js", "data.json", "manifest.webmanifest",
  "medya/logo-kucuk.png", "medya/favicon.png", "vendor/fonts/fonts.css",
  "vendor/fonts/cormorant-garamond-cyrillic-600-normal.woff2",  "vendor/fonts/cormorant-garamond-cyrillic-700-normal.woff2",  "vendor/fonts/cormorant-garamond-latin-600-normal.woff2",  "vendor/fonts/cormorant-garamond-latin-700-normal.woff2",  "vendor/fonts/cormorant-garamond-latin-ext-600-normal.woff2",  "vendor/fonts/cormorant-garamond-latin-ext-700-normal.woff2",  "vendor/fonts/nunito-cyrillic-400-normal.woff2",  "vendor/fonts/nunito-cyrillic-600-normal.woff2",  "vendor/fonts/nunito-cyrillic-700-normal.woff2",  "vendor/fonts/nunito-cyrillic-800-normal.woff2",  "vendor/fonts/nunito-latin-400-normal.woff2",  "vendor/fonts/nunito-latin-600-normal.woff2",  "vendor/fonts/nunito-latin-700-normal.woff2",  "vendor/fonts/nunito-latin-800-normal.woff2",  "vendor/fonts/nunito-latin-ext-400-normal.woff2",  "vendor/fonts/nunito-latin-ext-600-normal.woff2",  "vendor/fonts/nunito-latin-ext-700-normal.woff2",  "vendor/fonts/nunito-latin-ext-800-normal.woff2",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SURUM).then((c) => c.addAll(KABUK)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SURUM).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.endsWith(".mp4")) return;
  const anahtar = u.origin + u.pathname;
  e.respondWith(new Promise((sonuc) => {
    let bitti = false;
    const onbellek = () => caches.match(anahtar, { ignoreSearch: true });
    const sure = setTimeout(async () => { const c = await onbellek(); if (c && !bitti) { bitti = true; sonuc(c); } }, 4000);
    fetch(e.request).then((r) => {
      if (r.ok) { const kopya = r.clone(); caches.open(SURUM).then((c) => c.put(anahtar, kopya)); }
      if (!bitti) { bitti = true; clearTimeout(sure); sonuc(r); }
    }).catch(async () => {
      clearTimeout(sure);
      if (!bitti) { bitti = true; sonuc((await onbellek()) || Response.error()); }
    });
  }));
});
