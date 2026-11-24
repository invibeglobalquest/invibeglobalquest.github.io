// Yönetici paneli: tüm takımları canlı izleme, harita, olay akışı, fotoğraflar, puan, konum ayarı
"use strict";
GUVEN.anahtar = "kv_oturum_y";

let TAKIMLAR = {}, KUCUK = {}, YONETIM = {};
let harita = null, noktaIsaret = {}, takimIsaret = {};
let acikTakim = null, sekme = "canli";
const RENK = ["#b3261e", "#c25a00", "#8d7200", "#2f7d52", "#0f7c7c", "#2364aa", "#6f3bb0", "#b0306d", "#6d4c3d", "#44546a"];

function renk(n) { return RENK[(parseInt(n, 10) - 1 + RENK.length * 10) % RENK.length]; }
function takimKaydi(n) { return TAKIMLAR[n] || {}; }
function takimRota(n) { return rotaAl(n, TAKIMLAR[n]); }
function yon(n, k) { return ((YONETIM[n] || {})[k]) || {}; }
function artefaktVar(n, id) {
  const y = yon(n, id);
  if (typeof y.artefakt === "boolean") return y.artefakt;
  return !!(((takimKaydi(n).adimlar || {})[id]) || {}).artefakt;
}
function puanTop(n) {
  let p = 0;
  const y = YONETIM[n] || {};
  for (const k in y) p += +((y[k] || {}).puan || 0);
  return p;
}
function bonusArtefaktlar() { return Object.keys(VERI.yol_gorevleri).filter((b) => VERI.yol_gorevleri[b].artefakt_var); }
function artefaktSay(n) {
  if (!takimKaydi(n).baslangic) return 0;
  return takimRota(n).filter((id) => artefaktVar(n, id)).length + bonusArtefaktlar().filter((b) => yon(n, b).artefakt === true).length;
}
function artefaktToplam(n) { return takimRota(n).length + bonusArtefaktlar().length; }
function sonHareket(k) {
  let m = k.guncel || k.baslangic || 0;
  for (const id in k.adimlar || {}) m = Math.max(m, k.adimlar[id].varis || 0, k.adimlar[id].bitis || 0);
  return Math.max(m, k.final || 0);
}
function fotoSay() {
  let s = 0;
  for (const n in KUCUK) s += Object.keys(KUCUK[n] || {}).length;
  return s;
}
function bonusBaslik(k) {
  const m = /^b_(.+)_\d+$/.exec(k);
  if (m) return TL((VERI.yol_gorevleri[m[1]] || {}).baslik);
  return noktaAdi(k.replace(/_tamam$/, "")) + (/_tamam$/.test(k) ? " · " + t("foto2") : "");
}

// ---------- PIN ----------
function pinCiz() {
  $("pinAlt").textContent = TL(VERI.etkinlik.ad);
  $("pinBaslik").textContent = t("pinBaslik");
  $("pinBtn").textContent = t("giris");
  $("pinGeri").textContent = t("takimEkrani");
  dilDugmeleri($("dilKutuPin"), pinCiz);
}
function girisYap() {
  $("pinEkran").classList.add("gizli");
  $("panel").classList.remove("gizli");
  panelBaslat();
}

// ---------- Panel ----------
function panelMetinleri() {
  document.title = t("yoneticiLink") + " · " + TL(VERI.etkinlik.ad);
  $("yBaslik").textContent = TL(VERI.etkinlik.ad);
  document.querySelectorAll(".sekme").forEach((b) => (b.textContent = t(b.dataset.sekme)));
  $("cikisBtn").textContent = t("cikis");
  $("akisBaslik").textContent = t("akis");
  $("konumBaslik").textContent = t("konumlar");
  $("konumAciklama").textContent = t("konumAciklama");
  $("tasiEtiket").textContent = t("tasi");
  $("pinNot").textContent = t("pinNot");
  $("tumunuSilBtn").textContent = t("tumunuSifirla");
  const u = $("dbUyari");
  u.classList.toggle("gizli", DB.var());
  u.textContent = t("dbYok");
  dilDugmeleri($("dilKutu"), () => { panelMetinleri(); hepsiniCiz(); ayarlarCiz(); noktaIsaretleri(); if (sekme === "linkler") linklerCiz(); });
}

function panelBaslat() {
  panelMetinleri();
  document.querySelectorAll(".sekme").forEach((b) => (b.onclick = () => sekmeAc(b.dataset.sekme)));
  $("cikisBtn").onclick = () => { yoneticiCikis(); location.reload(); };
  $("detayKapat").onclick = detayKapat;
  $("detay").onclick = (e) => { if (e.target.id === "detay") detayKapat(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") detayKapat(); });
  $("tumunuSilBtn").onclick = tumunuSil;
  $("tasiKutu").onchange = tasimaAyarla;
  haritaKur();
  ayarlarCiz();
  veriIzle();
  setInterval(() => { $("saatSimdi").textContent = new Date().toLocaleTimeString(DIL === "tr" ? "tr-TR" : "ru-RU"); kartlarCiz(); istatistikCiz(); }, 1000);
  setInterval(() => { akisCiz(); haritaGuncelle(); if (sekme === "siralama") siralamaCiz(); }, 15000);
}
function sekmeAc(s) {
  sekme = s;
  document.querySelectorAll(".sekme").forEach((b) => b.classList.toggle("secili", b.dataset.sekme === s));
  ["canli", "siralama", "linkler", "ayarlar"].forEach((x) => $("s-" + x).classList.toggle("gizli", x !== s));
  if (s === "siralama") siralamaCiz();
  if (s === "linkler") linklerCiz();
  if (s === "ayarlar") ayarlarCiz();
  if (s === "canli" && harita) setTimeout(() => harita.invalidateSize(), 50);
}

// ---------- Veri izleme ----------
let cizimBekliyor = false;
function cizimIste() {
  if (cizimBekliyor) return;
  cizimBekliyor = true;
  requestAnimationFrame(() => { cizimBekliyor = false; hepsiniCiz(); });
}
function baglantiGoster(ok) {
  const b = $("baglanti");
  b.classList.toggle("ok", !!ok);
  b.querySelector("span").textContent = DB.var() ? (ok ? t("bagli") : t("kopuk")) : t("snkYok");
}
function veriIzle() {
  if (DB.var()) {
    DB.izle("takimlar", (v) => { TAKIMLAR = v || {}; cizimIste(); }, baglantiGoster);
    DB.izle("kucuk", (v) => { KUCUK = v || {}; cizimIste(); });
    DB.izle("yonetim", (v) => { YONETIM = v || {}; cizimIste(); });
    DB.izle("ayarlar/konumlar", (v) => { konumlariUygula(v || null).then(() => { noktaIsaretleri(); if (sekme === "ayarlar") ayarlarCiz(); }); });
  } else {
    // Ortak veritabanı yok: yalnızca bu cihazdaki takım (deneme için)
    const yerelOku = () => {
      let d = {}, k = {};
      try { d = JSON.parse(localStorage.getItem("kv_durum")) || {}; k = JSON.parse(localStorage.getItem("kv_kucuk")) || {}; } catch (e) {}
      TAKIMLAR = d.takim ? { [d.takim]: d } : {};
      KUCUK = d.takim ? { [d.takim]: k } : {};
      cizimIste();
    };
    yerelOku();
    setInterval(yerelOku, 3000);
    window.addEventListener("storage", yerelOku);
    baglantiGoster(false);
  }
}
function hepsiniCiz() {
  istatistikCiz();
  kartlarCiz();
  akisCiz();
  haritaGuncelle();
  if (sekme === "siralama") siralamaCiz();
  const ae = document.activeElement;
  if (acikTakim && !(ae && ae.tagName === "INPUT" && $("detay").contains(ae))) detayCiz();
}

// ---------- Özet ve kartlar ----------
function istatistikCiz() {
  const nolar = takimNolari(), simdi = Date.now();
  let bas = 0, bit = 0, gec = 0;
  nolar.forEach((n) => {
    const d = durumHesapla(takimKaydi(n), takimRota(n), simdi);
    if (d.faz !== "baslamadi") bas++;
    if (d.faz === "bitti") bit++;
    if (d.kalan < 0) gec++;
  });
  const kutu = (et, de, sinif) => '<div class="ist' + (sinif ? " " + sinif : "") + '"><small>' + esc(et) + "</small><b>" + de + "</b></div>";
  $("istatistik").innerHTML = kutu(t("sBasladi"), bas + "/" + nolar.length) + kutu(t("sBitirdi"), bit) +
    kutu(t("sGecikme"), gec, gec ? "uyar" : "") + kutu(t("sFoto"), fotoSay());
}

function durumMetni(n, d, html) {
  const ad = (id) => { const s = VERI.istasyonlar[id]; return s ? TL(s.baslik) : id; };
  if (html) {
    switch (d.faz) {
      case "baslamadi": return esc(t("dBaslamadi"));
      case "yol": return ikon("ok") + " " + esc(t("dYol", { x: ad(d.id) }));
      case "gorev": return noktaIkon(d.id) + " " + esc(t("dGorev", { x: ad(d.id) }));
      case "final": return ikon("sarnic") + " " + esc(t("dFinal"));
      default: return ikon("bayrak") + " " + esc(t("dBitti"));
    }
  }
  switch (d.faz) {
    case "baslamadi": return t("dBaslamadi");
    case "yol": return t("dYol", { x: ad(d.id) });
    case "gorev": return t("dGorev", { x: ad(d.id) });
    case "final": return t("dFinal");
    default: return t("dBitti");
  }
}

function kartlarCiz() {
  const simdi = Date.now();
  let h = "";
  takimNolari().forEach((n) => {
    const k = takimKaydi(n), r = takimRota(n), d = durumHesapla(k, r, simdi);
    let sinif = "t-kart";
    if (d.faz === "baslamadi") sinif += " bos";
    else if (d.faz === "bitti") sinif += " bitti";
    else if (d.kalan < 0) sinif += " gec";
    let sayac = "";
    if (d.faz === "yol" || d.faz === "gorev" || d.faz === "final") sayac = '<span class="t-sayac' + (d.kalan < 0 ? " gec" : d.kalan < 120000 ? " az" : "") + '">' + sureYaz(d.kalan) + "</span>";
    else if (d.faz === "bitti") sayac = '<span class="t-sayac">' + sureYaz(d.toplam) + "</span>";
    const gps = k.konum && k.konum.ts ? "📍 " + onceYaz(k.konum.ts, simdi) : "";
    h += '<button type="button" class="' + sinif + '" data-takim="' + esc(n) + '" style="--renk:' + renk(n) + '">' +
      '<div class="t-ust"><span class="t-no">' + esc(n) + "</span><span class=\"t-ad\"><b>" + esc(t("takim")) + " " + esc(n) + "</b>" +
      (k.ad ? "<small>" + esc(k.ad) + "</small>" : "") + "</span>" + sayac + "</div>" +
      '<div class="t-durum">' + durumMetni(n, d, true) + "</div>" +
      '<div class="bar"><i style="width:' + (100 * d.tamam / (r.length || 1)) + '%"></i></div>' +
      '<div class="t-alt"><span>' + d.tamam + "/" + r.length + "</span><span>★ " + artefaktSay(n) + "</span><span>" + puanTop(n) + " " + esc(t("puan").toLowerCase()) + "</span>" +
      (gps ? "<span>" + ikon("konum") + " " + esc(gps.replace(/^📍\s*/, "")) + "</span>" : "") +
      (k.baslangic ? '<span class="sag">' + esc(onceYaz(sonHareket(k), simdi)) + "</span>" : "") + "</div></button>";
  });
  const kutu = $("takimKartlari");
  kutu.innerHTML = h;
  kutu.querySelectorAll(".t-kart").forEach((b) => (b.onclick = () => detayAc(b.dataset.takim)));
}

// ---------- Olay akışı ----------
function olaylar() {
  const L2 = [];
  for (const n in TAKIMLAR) {
    const k = TAKIMLAR[n];
    if (!k || !k.baslangic) continue;
    L2.push({ ts: k.baslangic, n, tur: "basla" });
    for (const id in k.adimlar || {}) {
      const a = k.adimlar[id];
      if (a.varis) L2.push({ ts: a.varis, n, tur: "varis", id, a });
      if (a.bitis) L2.push({ ts: a.bitis, n, tur: "bitis", id, a });
    }
    for (const b in k.bonus || {}) for (const ts in k.bonus[b] || {}) L2.push({ ts: +ts, n, tur: "bonus", id: b, key: "b_" + b + "_" + ts });
    if (k.final) L2.push({ ts: k.final, n, tur: "final" });
  }
  return L2.sort((a, b) => b.ts - a.ts).slice(0, 80);
}
function akisCiz() {
  const ol = olaylar(), simdi = Date.now();
  if (!ol.length) { $("akis").innerHTML = '<li class="soluk">' + esc(t("akisBos")) + "</li>"; return; }
  $("akis").innerHTML = ol.map((o) => {
    let metin = "", foto = "";
    const s = VERI.istasyonlar[o.id];
    const ad = s ? TL(s.baslik) : "";
    if (o.tur === "basla") metin = ikon("baslat") + " " + esc(t("oBasla"));
    else if (o.tur === "varis") {
      metin = ikon("foto") + " " + esc(t("oVaris", { x: ad }) + (o.a.mesafe != null ? " · " + t("uzak", { m: o.a.mesafe }) : ""));
      foto = (KUCUK[o.n] || {})[o.id] ? o.id : "";
    } else if (o.tur === "bitis") {
      const sure = o.a.varis ? " (" + dakika(o.a.bitis - o.a.varis) + ")" : "";
      metin = ikon("tamam") + " " + esc(t("oBitis", { x: ad }) + sure) + (artefaktVar(o.n, o.id) ? " " + ikon("yildiz", "altin") : "");
      foto = (KUCUK[o.n] || {})[o.id + "_tamam"] ? o.id + "_tamam" : "";
    } else if (o.tur === "bonus") {
      metin = ikon("yildiz") + " " + esc(t("oBonus", { x: bonusBaslik(o.key) }));
      foto = (KUCUK[o.n] || {})[o.key] ? o.key : "";
    } else metin = ikon("bayrak") + " " + esc(t("oFinal"));
    return '<li><span class="a-saat">' + saat(o.ts) + "<small>" + esc(onceYaz(o.ts, simdi)) + "</small></span>" +
      '<span class="t-no kucuk" style="--renk:' + renk(o.n) + '">' + esc(o.n) + "</span>" +
      '<span class="a-metin"><b>' + esc(t("takim")) + " " + esc(o.n) + "</b> " + metin + "</span>" +
      (foto ? '<img class="foto-mini" data-n="' + esc(o.n) + '" data-k="' + esc(foto) + '" src="' + KUCUK[o.n][foto] + '" alt="">' : "") + "</li>";
  }).join("");
  $("akis").querySelectorAll("img[data-k]").forEach((img) => (img.onclick = () => tamFoto(img.dataset.n, img.dataset.k, img.src)));
}
async function tamFoto(n, k, kucukSrc) {
  const img = fotoGoster(kucukSrc, t("takim") + " " + n + " · " + bonusBaslik(k));
  if (!DB.var()) return;
  try {
    const buyuk = await DB.get("foto/" + n + "/" + k);
    if (buyuk && img.src === kucukSrc) img.src = buyuk;
  } catch (e) {}
}

// ---------- Harita ----------
function haritaKur() {
  if (typeof window.L === "undefined" || !window.L.map) { $("harita").innerHTML = '<p class="soluk" style="padding:16px">Harita yüklenemedi.</p>'; return; }
  const b = VERI.baslangic;
  harita = window.L.map("harita", { scrollWheelZoom: false }).setView([b.lat, b.lng], 16);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: "© OpenStreetMap"
  }).addTo(harita);
  noktaIsaretleri();
  const sinir = window.L.latLngBounds([[b.lat, b.lng]].concat(Object.values(VERI.istasyonlar).map((s) => [s.lat, s.lng])));
  harita.fitBounds(sinir, { padding: [24, 24] });
}
function noktaIsaretleri() {
  if (!harita) return;
  const Lf = window.L;
  const ekle = (id, n, emoji, ad) => {
    const ikon = Lf.divIcon({ className: "", html: '<div class="n-isaret' + (n.dogrula ? " dogrula" : "") + '">' + emoji + "</div>", iconSize: [34, 34], iconAnchor: [17, 17] });
    if (noktaIsaret[id]) {
      noktaIsaret[id].setLatLng([n.lat, n.lng]).setIcon(ikon);
      noktaIsaret[id].setTooltipContent(ad);
    } else {
      const m = Lf.marker([n.lat, n.lng], { icon: ikon, zIndexOffset: -100 }).addTo(harita).bindTooltip(ad);
      m.on("dragend", () => tasindi(id, m));
      noktaIsaret[id] = m;
    }
  };
  ekle(VERI.baslangic.id, VERI.baslangic, ikon("sarnic"), TL(VERI.baslangic.ad) + " · " + t("baslangicN") + " / " + t("finalN"));
  for (const id in VERI.istasyonlar) {
    const s = VERI.istasyonlar[id];
    ekle(id, s, noktaIkon(id), TL(s.baslik) + " — " + TL(s.yer) + (s.dogrula ? " ⚠ " + t("dogrula") : ""));
  }
  tasimaAyarla();
  haritaGuncelle();
}
function haritaGuncelle() {
  if (!harita) return;
  const Lf = window.L, simdi = Date.now();
  takimNolari().forEach((n, sira) => {
    const k = takimKaydi(n), r = takimRota(n), d = durumHesapla(k, r, simdi);
    let konum = null, canli = false;
    if (d.faz !== "baslamadi") {
      if (k.konum && k.konum.ts && simdi - k.konum.ts < 5 * 60000) { konum = [k.konum.lat, k.konum.lng]; canli = true; }
      else {
        const hedef = d.faz === "final" || d.faz === "bitti" ? VERI.baslangic : nokta(d.id);
        const aci = (sira / 10) * 2 * Math.PI;
        konum = [hedef.lat + 0.00009 * Math.sin(aci), hedef.lng + 0.00012 * Math.cos(aci)];
      }
    }
    if (!konum) { if (takimIsaret[n]) { harita.removeLayer(takimIsaret[n]); delete takimIsaret[n]; } return; }
    const ikon = Lf.divIcon({
      className: "", iconSize: [30, 30], iconAnchor: [15, 15],
      html: '<div class="t-isaret' + (canli ? "" : " tahmini") + (d.kalan < 0 ? " gec" : "") + '" style="--renk:' + renk(n) + '">' + esc(n) + "</div>"
    });
    const ipucu = t("takim") + " " + n + " — " + durumMetni(n, d) + (canli ? " · 📍 " + onceYaz(k.konum.ts, simdi) : " · " + t("gpsYok"));
    if (takimIsaret[n]) takimIsaret[n].setLatLng(konum).setIcon(ikon).setTooltipContent(ipucu);
    else {
      takimIsaret[n] = Lf.marker(konum, { icon: ikon, zIndexOffset: 500 }).addTo(harita).bindTooltip(ipucu);
      takimIsaret[n].on("click", () => detayAc(n));
    }
  });
}
function tasimaAyarla() {
  const ac = $("tasiKutu").checked;
  for (const id in noktaIsaret) {
    const m = noktaIsaret[id];
    if (m.dragging) ac ? m.dragging.enable() : m.dragging.disable();
  }
  if (ac && sekme !== "canli") sekmeAc("canli");
}
async function tasindi(id, m) {
  const p = m.getLatLng(), n = nokta(id);
  if (!confirm(t("tasiOnay", { x: noktaAdi(id) }))) { m.setLatLng([n.lat, n.lng]); return; }
  await konumKaydet(id, +p.lat.toFixed(6), +p.lng.toFixed(6));
}

// ---------- Takım detayı ----------
function detayAc(n) {
  acikTakim = n;
  detayCiz();
  $("detay").classList.add("acik");
  $("detay").setAttribute("aria-hidden", "false");
}
function detayKapat() {
  acikTakim = null;
  $("detay").classList.remove("acik");
  $("detay").setAttribute("aria-hidden", "true");
}
function puanGirdi(n, k) {
  const p = yon(n, k).puan || 0;
  return '<label class="puan-girdi"><span>' + esc(t("puan")) + '</span><input type="number" inputmode="numeric" step="1" data-n="' + esc(n) + '" data-k="' + esc(k) + '" value="' + p + '"></label>';
}
function detayCiz() {
  const n = acikTakim;
  if (!n) return;
  const k = takimKaydi(n), r = takimRota(n), simdi = Date.now(), d = durumHesapla(k, r, simdi);
  // geri alınabilecek tek işaret: son yapılan (final, mevcut noktanın varışı ya da önceki noktanın bitişi)
  let geri = null;
  if (k.final) geri = { tur: "final" };
  else if (d.faz === "gorev") geri = { tur: "varis", id: d.id };
  else if (d.tamam > 0) geri = { tur: "bitis", id: r[d.tamam - 1] };
  const geriBtn = (tur, id) => geri && geri.tur === tur && (tur === "final" || geri.id === id)
    ? '<button type="button" class="geri-al" data-n="' + esc(n) + '" data-id="' + esc(id || "") + '" data-tur="' + tur + '">' + esc(t("geriAl")) + "</button>" : "";
  $("detayBaslik").innerHTML = '<span class="t-no" style="--renk:' + renk(n) + '">' + esc(n) + "</span> " + esc(t("takim")) + ' <span class="sayi">' + esc(n) + "</span>" + (k.ad ? " · " + esc(k.ad) : "");
  let h = '<p class="t-durum">' + durumMetni(n, d, true) + "</p>";
  h += '<div class="ozet-kart kart"><div><small>' + esc(t("baslangicN")) + "</small><b>" + saat(k.baslangic) + "</b></div>" +
    "<div><small>" + esc(t("sure")) + "</small><b>" + (k.baslangic ? sureYaz((k.final || simdi) - k.baslangic) : "—") + "</b></div>" +
    "<div><small>★</small><b>" + artefaktSay(n) + "/" + artefaktToplam(n) + "</b></div>" +
    "<div><small>" + esc(t("puan")) + "</small><b>" + puanTop(n) + "</b></div></div>";
  if (k.konum && k.konum.ts) {
    h += '<p class="soluk">📍 GPS ' + saat(k.konum.ts) + " (" + esc(onceYaz(k.konum.ts, simdi)) + "), ±" + (k.konum.acc ?? "?") + ' m · <a target="_blank" rel="noopener" href="https://www.google.com/maps?q=' + k.konum.lat + "," + k.konum.lng + '">' + esc(t("haritadaAc")) + "</a></p>";
  }
  h += '<div class="d-liste">';
  let onceki = k.baslangic;
  r.forEach((id, i) => {
    const s = VERI.istasyonlar[id], a = (k.adimlar || {})[id] || {};
    const [pb, ps] = k.baslangic ? planDilim(k.baslangic, i) : [null, null];
    const kc = (KUCUK[n] || {})[id];
    const yolSure = a.varis && onceki ? a.varis - onceki : null;
    const gorevSure = a.bitis && a.varis ? a.bitis - a.varis : null;
    const yolGec = yolSure != null && yolSure > noktaMs(), gorevGec = !!(a.bitis && onceki && a.bitis - onceki > noktaMs());
    const art = artefaktVar(n, id);
    h += '<div class="d-satir' + (a.bitis ? " tamam" : i === d.i ? " aktif" : "") + '">' +
      (kc ? '<img class="foto-mini" data-n="' + esc(n) + '" data-k="' + esc(id) + '" src="' + kc + '" alt="" title="' + esc(t("foto1")) + '">' : '<span class="foto-mini bos">' + (i + 1) + "</span>") +
      ((KUCUK[n] || {})[id + "_tamam"] ? '<img class="foto-mini odul" data-n="' + esc(n) + '" data-k="' + esc(id + "_tamam") + '" src="' + KUCUK[n][id + "_tamam"] + '" alt="" title="' + esc(t("foto2")) + '">' : "") +
      '<div class="d-bilgi"><b>' + (i + 1) + ". " + noktaIkon(id) + " " + esc(TL(s.baslik)) + "</b>" +
      "<small>" + esc(t("kPlan")) + " " + saat(pb) + "–" + saat(ps) + " · " + esc(t("kVaris")) + " " + saat(a.varis) +
      (yolSure != null ? ' <span class="' + (yolGec ? "kirmizi-yazi" : "") + '">(' + esc(t("kYol")) + " " + dakika(yolSure) + ")</span>" : "") +
      " · " + esc(t("kBitis")) + " " + saat(a.bitis) +
      (gorevSure != null ? ' <span class="' + (gorevGec ? "kirmizi-yazi" : "") + '">(' + esc(t("kGorev")) + " " + dakika(gorevSure) + ")</span>" : "") +
      (a.mesafe != null ? " · 📍 " + a.mesafe + " m" : "") + "</small></div>" +
      '<div class="d-islem">' + geriBtn("bitis", id) + geriBtn("varis", id) + '<button type="button" class="yildiz' + (art ? " var" : "") + '" data-n="' + esc(n) + '" data-k="' + esc(id) + '" data-v="' + (art ? 1 : 0) + '" title="' + esc(TL(s.artefakt)) + '" aria-label="' + esc(t("artefakt")) + '">' + (art ? "★" : "☆") + "</button>" +
      puanGirdi(n, id) + "</div></div>";
    if (a.bitis) onceki = a.bitis;
  });
  h += "</div>";
  // Yol görevleri
  h += '<h3 class="kucuk-baslik">' + esc(t("yolGorevleri")) + "</h3>";
  for (const b in VERI.yol_gorevleri) {
    const g = VERI.yol_gorevleri[b], tsler = Object.keys(((k.bonus || {})[b]) || {}).sort();
    const art = yon(n, b).artefakt === true;
    h += '<div class="d-satir bonus"><div class="d-bilgi"><b>' + noktaIkon(b) + " " + esc(TL(g.baslik)) + "</b><small>" + esc(t("fotoSayisi", { n: tsler.length })) + "</small>" +
      '<div class="foto-izgara">' + tsler.map((x) => {
        const kk = "b_" + b + "_" + x, kc = (KUCUK[n] || {})[kk];
        return kc ? '<img class="foto-mini" data-n="' + esc(n) + '" data-k="' + esc(kk) + '" src="' + kc + '" alt="">' : "";
      }).join("") + "</div></div>" +
      '<div class="d-islem">' + (g.artefakt_var ? '<button type="button" class="yildiz' + (art ? " var" : "") + '" data-n="' + esc(n) + '" data-k="' + esc(b) + '" data-v="' + (art ? 1 : 0) + '" title="' + esc(TL(g.artefakt)) + '">' + (art ? "★" : "☆") + "</button>" : "") +
      puanGirdi(n, b) + "</div></div>";
  }
  if (k.final) h += '<p class="t-durum">' + ikon("bayrak") + " " + esc(t("oFinal")) + " · " + saat(k.final) + " " + geriBtn("final") + "</p>";
  h += '<button type="button" class="btn kirmizi kucuk" id="sifirlaBtn">' + esc(t("sifirla")) + "</button>";
  const ic = $("detayIc");
  ic.innerHTML = h;
  ic.querySelectorAll("img[data-k]").forEach((img) => (img.onclick = () => tamFoto(img.dataset.n, img.dataset.k, img.src)));
  ic.querySelectorAll(".yildiz").forEach((b) => (b.onclick = () => yonetimYaz(b.dataset.n, b.dataset.k, "artefakt", b.dataset.v !== "1")));
  ic.querySelectorAll(".geri-al").forEach((b) => (b.onclick = () => geriAl(b.dataset.n, b.dataset.id, b.dataset.tur)));
  ic.querySelectorAll(".puan-girdi input").forEach((inp) => (inp.onchange = () => {
    const v = parseInt(inp.value, 10);
    yonetimYaz(inp.dataset.n, inp.dataset.k, "puan", isFinite(v) ? v : 0);
    inp.blur();
  }));
  $("sifirlaBtn").onclick = () => takimSifirla(n);
}
// Liderin yanlışlıkla bastığı son işareti geri alır; lider telefonu 20 sn içinde güncellenir
async function geriAl(n, id, tur) {
  if (!confirm(t("geriAlOnay", { n, x: tur === "final" ? t("oFinal") : noktaAdi(id) }))) return;
  const p = { duzeltme: Date.now() };
  if (tur === "final") p.final = null;
  else if (tur === "bitis") { p["adimlar/" + id + "/bitis"] = null; p["adimlar/" + id + "/artefakt"] = null; p["adimlar/" + id + "/foto2"] = null; }
  else p["adimlar/" + id] = null;
  if (!DB.var()) {
    const d = TAKIMLAR[n] || {};
    if (tur === "final") delete d.final;
    else if (tur === "bitis") { delete d.adimlar[id].bitis; delete d.adimlar[id].artefakt; }
    else delete d.adimlar[id];
    try { localStorage.setItem("kv_durum", JSON.stringify(d)); } catch (e) {}
    hepsiniCiz();
    return;
  }
  try {
    await DB.patch("takimlar/" + n, p);
    const k = tur === "varis" ? id : tur === "bitis" ? id + "_tamam" : null;
    if (k) await Promise.all([DB.sil("kucuk/" + n + "/" + k), DB.sil("foto/" + n + "/" + k)]).catch(() => {});
  } catch (e) { alert(t("kopuk")); }
  if (document.activeElement) document.activeElement.blur();
  detayCiz();
}
async function yonetimYaz(n, k, alan, deger) {
  YONETIM[n] = YONETIM[n] || {};
  YONETIM[n][k] = Object.assign({}, YONETIM[n][k], { [alan]: deger });
  hepsiniCiz();
  detayCiz();
  if (!DB.var()) return;
  try { await DB.put("yonetim/" + n + "/" + k + "/" + alan, deger); } catch (e) { alert(t("kopuk")); }
}
async function takimSifirla(n) {
  if (!confirm(t("sifirlaOnay", { n }))) return;
  if (DB.var()) {
    try { await Promise.all(["takimlar", "kucuk", "foto", "yonetim"].map((p) => DB.sil(p + "/" + n))); }
    catch (e) { alert(t("kopuk")); return; }
  } else {
    try { localStorage.removeItem("kv_durum"); localStorage.removeItem("kv_kucuk"); } catch (e) {}
  }
  delete TAKIMLAR[n]; delete KUCUK[n]; delete YONETIM[n];
  detayKapat();
  hepsiniCiz();
}
async function tumunuSil() {
  if (!confirm(t("tumunuOnay"))) return;
  if (DB.var()) {
    try { await Promise.all(["takimlar", "kucuk", "foto", "yonetim"].map((p) => DB.sil(p))); }
    catch (e) { alert(t("kopuk")); return; }
  }
  TAKIMLAR = {}; KUCUK = {}; YONETIM = {};
  hepsiniCiz();
}

// ---------- Sıralama ----------
function siralamaCiz() {
  const simdi = Date.now();
  const satir = takimNolari().map((n) => {
    const k = takimKaydi(n), r = takimRota(n), d = durumHesapla(k, r, simdi);
    return { n, k, d, r, art: artefaktSay(n), puan: puanTop(n), sure: d.faz === "bitti" ? d.toplam : Infinity };
  });
  satir.sort((a, b) => b.art - a.art || b.puan - a.puan || a.sure - b.sure || b.d.tamam - a.d.tamam || a.n - b.n);
  let h = "<thead><tr><th>" + esc(t("sira")) + "</th><th>" + esc(t("takim")) + "</th><th>★</th><th>" + esc(t("puan")) + "</th><th>" + esc(t("tamamNokta")) + "</th><th>" + esc(t("sure")) + "</th></tr></thead><tbody>";
  satir.forEach((s, i) => {
    const sure = s.d.faz === "bitti" ? sureYaz(s.d.toplam) + " " + ikon("bayrak") : s.k.baslangic ? sureYaz(simdi - s.k.baslangic) : "—";
    h += '<tr data-takim="' + esc(s.n) + '"><td>' + (i + 1) + '</td><td><span class="t-no kucuk" style="--renk:' + renk(s.n) + '">' + esc(s.n) + "</span> " + esc(t("takim")) + " " + esc(s.n) + (s.k.ad ? " · " + esc(s.k.ad) : "") +
      '</td><td class="sayi">' + s.art + '</td><td class="sayi">' + s.puan + '</td><td class="sayi">' + s.d.tamam + "/" + s.r.length + '</td><td class="sayi">' + sure + "</td></tr>";
  });
  $("siraTablo").innerHTML = h + "</tbody>";
  $("siraTablo").querySelectorAll("tr[data-takim]").forEach((tr) => (tr.onclick = () => detayAc(tr.dataset.takim)));
}

// ---------- Linkler (QR) ----------
function siteKok() { return (VERI.etkinlik.site_url || location.origin + location.pathname.replace(/[^/]*$/, "")).replace(/\/?$/, "/"); }
function qrSvg(metin) {
  if (typeof qrcode !== "function") return "";
  const q = qrcode(0, "M");
  q.addData(metin);
  q.make();
  return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}
function linkKart(baslik, alt, link, ek, renkNo) {
  return '<div class="kart link-kart"><div class="qr" aria-hidden="true">' + qrSvg(link) + '</div><div class="link-bilgi">' +
    "<h3>" + (renkNo ? '<span class="t-no kucuk" style="--renk:' + renk(renkNo) + '">' + esc(renkNo) + "</span> " : "") + esc(baslik) + "</h3>" +
    (alt ? '<p class="soluk">' + esc(alt) + "</p>" : "") + (ek || "") +
    "<code>" + esc(link) + '</code><button type="button" class="metin-btn kopyala" data-link="' + esc(link) + '">' + esc(t("kopyala")) + "</button></div></div>";
}
function linklerCiz() {
  const kok = siteKok(), kodlar = VERI.lider_kodlari || {};
  let h = '<div class="link-ust"><p class="soluk">' + esc(t("linkAcik")) + '</p><a class="btn ikincil kucuk" href="ekran.html" target="_blank" rel="noopener">' + ikon("ekran") + " " + esc(t("ekranLink")) + '</a><a class="btn ikincil kucuk" href="baski.html">' + esc(t("baskiPaketi")) + '</a><button type="button" class="btn ana kucuk" id="yazdirBtn">' + esc(t("yazdir")) + "</button></div>";
  h += '<h2 class="bolum-baslik">' + esc(t("ortakLink")) + "</h2>";
  h += '<div class="link-izgara">' + linkKart(TL(VERI.etkinlik.ad), t("ortakAcik"), kok) + "</div>";
  h += '<h2 class="bolum-baslik sayfa-kir">' + esc(t("liderLinkleri")) + '</h2><p class="uyari-yazi">⚠ ' + esc(t("liderUyari")) + '</p><div class="link-izgara">';
  takimNolari().forEach((n) => {
    if (!kodlar[n]) return;
    const link = kok + "?t=" + encodeURIComponent(n) + "&k=" + encodeURIComponent(kodlar[n]);
    h += linkKart(t("takim") + " " + n + " · " + t("liderLink"), t("ilkNokta", { x: noktaAdi(VERI.rotalar[n][0]) }), link,
      "<p>" + esc(t("kod")) + ': <b class="kod">' + esc(kodlar[n]) + "</b></p>", n);
  });
  h += "</div>";
  const s = $("s-linkler");
  s.innerHTML = h;
  $("yazdirBtn").onclick = () => window.print();
  s.querySelectorAll(".kopyala").forEach((b) => (b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.link); }
    catch (e) { prompt(t("kopyala"), b.dataset.link); return; }
    b.textContent = t("kopyalandi");
    setTimeout(() => (b.textContent = t("kopyala")), 1600);
  }));
}

// ---------- Ayarlar: güvenlik ----------
function kurallarMetni() {
  const a = GUVEN.alan(), Y = "auth != null && auth.token.email == 'yonetici@" + a + "'";
  const T = "auth != null && (auth.token.email == 'takim' + $n + '@" + a + "' || auth.token.email == 'yonetici@" + a + "')";
  const oku = "auth != null";
  return JSON.stringify({ rules: {
    takimlar: { ".read": oku, "$n": { ".write": T } },
    kucuk: { ".read": oku, "$n": { ".write": T } },
    foto: { ".read": oku, "$n": { ".write": T } },
    yonetim: { ".read": oku, ".write": Y },
    ayarlar: { ".read": oku, ".write": Y },
    gizli: { ".read": Y, ".write": Y }
  } }, null, 2);
}
function guvenlikCiz(mesaj) {
  const k = $("guvenlikKutu");
  if (!k) return;
  let h = "<h3>" + ikon("kalkan") + " " + esc(t("guvenlik")) + "</h3>";
  if (GUVEN.aktif() && !GUVEN.kurulum) h += '<p class="yesil-yazi">' + esc(t("guvenliMod")) + "</p>";
  else {
    h += '<p class="soluk">' + esc(t("acikMod")) + "</p>";
    if (GUVEN.key() && VERI.lider_kodlari && VERI.etkinlik.yonetici_pin) h += '<button type="button" class="btn ana kucuk" id="kurulumBtn">' + esc(t("kurulumBtn")) + "</button>";
    else h += '<p class="soluk">Firebase Authentication açılıp Web API anahtarı data.json\'a (firebase_api_key) eklenince kurulum düğmesi görünür.</p>';
  }
  if (mesaj) h += mesaj;
  k.innerHTML = h;
  const b = $("kurulumBtn");
  if (b) b.onclick = guvenlikKurulumu;
  const kb = $("kurallarBtn");
  if (kb) kb.onclick = async () => { try { await navigator.clipboard.writeText(kurallarMetni()); kb.textContent = t("kopyalandi"); } catch (e) { $("kurallarAlan").select(); } };
}
async function guvenlikKurulumu() {
  if (!confirm(t("kurulumBtn") + "?")) return;
  $("kurulumBtn").disabled = true;
  const satirlar = [];
  GUVEN.kurulum = true;
  try {
    const hesaplar = [["yonetici", null, VERI.etkinlik.yonetici_pin]].concat(takimNolari().map((n) => ["lider", n, VERI.lider_kodlari[n]]));
    for (const [rol, n, deger] of hesaplar) {
      const e = GUVEN.eposta(rol, n);
      try { await GUVEN.kayit(e, GUVEN.sifre(rol, deger)); satirlar.push(e + " ✓"); }
      catch (err) { satirlar.push(e + (/EMAIL_EXISTS/.test(err.kod) ? " ✓ (var)" : " ✗ " + err.kod)); }
    }
    await GUVEN.giris(GUVEN.eposta("yonetici"), GUVEN.sifre("yonetici", VERI.etkinlik.yonetici_pin));
    await DB.put("gizli/kodlar", VERI.lider_kodlari);
    satirlar.push("gizli/kodlar ✓");
    guvenlikCiz('<p class="yesil-yazi">' + esc(t("kurulumTamam")) + '</p><pre class="kurulum-log">' + esc(satirlar.join("\n")) + "</pre>" +
      '<textarea id="kurallarAlan" class="kurallar" readonly rows="14">' + esc(kurallarMetni()) + '</textarea><button type="button" class="btn ikincil kucuk" id="kurallarBtn">' + esc(t("kurallarKopyala")) + "</button>");
  } catch (e) {
    guvenlikCiz('<p class="kirmizi-yazi">' + esc(t("girisHata")) + " (" + esc(e.kod || e.message) + ')</p><pre class="kurulum-log">' + esc(satirlar.join("\n")) + "</pre>");
  } finally {
    GUVEN.kurulum = false;
  }
}

// ---------- Ayarlar: konumlar ----------
function ayarlarCiz() {
  if (!$("guvenlikKutu").innerHTML) guvenlikCiz();
  const idler = [VERI.baslangic.id].concat(Object.keys(VERI.istasyonlar));
  $("konumListe").innerHTML = idler.map((id) => {
    const n = nokta(id), bas = id === VERI.baslangic.id;
    return '<div class="kart konum-satir" data-id="' + esc(id) + '"><div class="konum-ad"><b>' + (bas ? ikon("sarnic") + " " + esc(TL(n.ad)) : noktaIkon(id) + " " + esc(TL(n.baslik))) + "</b>" +
      "<small>" + (bas ? esc(t("baslangicN")) + " / " + esc(t("finalN")) : esc(TL(n.yer))) + (n.dogrula ? ' · <span class="kirmizi-yazi">⚠ ' + esc(t("dogrula")) + "</span>" : "") + "</small></div>" +
      '<input class="konum-girdi" value="' + n.lat + ", " + n.lng + '" aria-label="lat, lng">' +
      '<div class="konum-btnlar"><button type="button" class="btn ikincil kucuk burada">' + esc(t("buradayim")) + "</button>" +
      '<button type="button" class="btn ana kucuk kaydet">' + esc(t("kaydet")) + "</button>" +
      '<a class="metin-btn" target="_blank" rel="noopener" href="https://www.google.com/maps?q=' + n.lat + "," + n.lng + '">' + esc(t("haritadaAc")) + "</a></div></div>";
  }).join("");
  $("konumListe").querySelectorAll(".konum-satir").forEach((sat) => {
    const id = sat.dataset.id, inp = sat.querySelector(".konum-girdi");
    sat.querySelector(".burada").onclick = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (p) => { inp.value = p.coords.latitude.toFixed(6) + ", " + p.coords.longitude.toFixed(6) + "  (±" + Math.round(p.coords.accuracy) + " m)"; },
        (e) => alert(e.message), { enableHighAccuracy: true, timeout: 20000 });
    };
    sat.querySelector(".kaydet").onclick = async () => {
      const m = /(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/.exec(inp.value);
      if (!m) { alert(t("konumHata")); return; }
      await konumKaydet(id, +m[1], +m[2]);
    };
  });
}
async function konumKaydet(id, lat, lng) {
  if (!DB.var()) { alert(t("dbYok")); noktaIsaretleri(); return; }
  try {
    await DB.put("ayarlar/konumlar/" + id, { lat, lng });
    const o = {}; o[id] = { lat, lng };
    await konumlariUygula(o);
    noktaIsaretleri();
    if (sekme === "ayarlar") ayarlarCiz();
  } catch (e) { alert(t("kopuk")); noktaIsaretleri(); }
}

// ---------- Başlat ----------
(async function () {
  try { await veriYukle(); }
  catch (e) { document.body.innerHTML = '<main><div class="kart"><p>' + esc(t("veriYok")) + "</p><p><b>" + esc(e.message) + "</b></p></div></main>"; return; }
  dilDegistir(DIL);
  if (VERI_SORUN) {
    const u = $("veriUyari");
    u.innerHTML = "<b>⚠ İçerik dosyasında (data.json) hata var.</b> " +
      (VERI_SORUN.yedek ? "Telefonlar son sağlam sürümle çalışmaya devam ediyor; düzeltilene kadar yeni değişiklikler görünmez." : "Eksik bölümler telefonlarda boş görünebilir.") +
      "<ul>" + VERI_SORUN.hatalar.slice(0, 8).map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";
    u.classList.remove("gizli");
  }
  pinCiz();
  if (await yoneticiOturumu()) { girisYap(); return; }
  $("pinForm").onsubmit = async (e) => {
    e.preventDefault();
    let ok = false;
    try { ok = await yoneticiDogrula($("pinGir").value); } catch (e2) { $("pinHata").textContent = t("girisHata"); return; }
    if (!ok) { $("pinHata").textContent = t("pinHata"); $("pinGir").select(); return; }
    girisYap();
  };
  $("pinGir").focus();
})();
