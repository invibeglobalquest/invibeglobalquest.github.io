// Final projeksiyon ekranı: canlı sıralama, fotoğraf slayt gösterisi, olay şeridi, artefakt duyuruları
"use strict";
GUVEN.anahtar = "kv_oturum_y";

const RENK = ["#b3261e", "#c25a00", "#8d7200", "#2f7d52", "#0f7c7c", "#2364aa", "#6f3bb0", "#b0306d", "#6d4c3d", "#44546a"];
let TAKIMLAR = {}, KUCUK = {}, YONETIM = {};
let fotoListe = [], fotoSira = 0, fotoAktif = 0;
const tamFotoOnbellek = new Map();
let gorulen = null;           // daha önce görülen olaylar (ilk yüklemede duyuru yapılmaz)
const duyuruKuyruk = [];
let duyuruSuruyor = false;

function renk(n) { return RENK[(parseInt(n, 10) - 1 + 100) % RENK.length]; }
function kayit(n) { return TAKIMLAR[n] || {}; }
function rotaN(n) { return rotaAl(n, TAKIMLAR[n]); }
function artVar(n, id) {
  const y = ((YONETIM[n] || {})[id]) || {};
  if (typeof y.artefakt === "boolean") return y.artefakt;
  return !!(((kayit(n).adimlar || {})[id]) || {}).artefakt;
}
function artSay(n) {
  const k = kayit(n);
  if (!k.baslangic) return 0;
  const bonus = Object.keys(VERI.yol_gorevleri).filter((b) => VERI.yol_gorevleri[b].artefakt_var && (((YONETIM[n] || {})[b]) || {}).artefakt === true).length;
  return rotaN(n).filter((id) => artVar(n, id)).length + bonus;
}
function puan(n) { let p = 0; const y = YONETIM[n] || {}; for (const k in y) p += +((y[k] || {}).puan || 0); return p; }

// ---------- sıralama ----------
function siraCiz() {
  const simdi = Date.now();
  const satir = takimNolari().map((n) => {
    const k = kayit(n), r = rotaN(n), d = durumHesapla(k, r, simdi);
    return { n, k, r, d, art: artSay(n), puan: puan(n), sure: d.faz === "bitti" ? d.toplam : Infinity };
  }).sort((a, b) => b.art - a.art || b.puan - a.puan || a.sure - b.sure || b.d.tamam - a.d.tamam || a.n - b.n);
  const durumYazi = (s) => {
    const ist = s.d.id && VERI.istasyonlar[s.d.id];
    switch (s.d.faz) {
      case "baslamadi": return t("dBaslamadi");
      case "yol": return ikon("ok") + " " + esc(TL(ist.baslik));
      case "bekle": return ikon("saat") + " " + esc(TL(ist.baslik));
      case "gorev": return noktaIkon(s.d.id) + " " + esc(TL(ist.baslik));
      case "final": return ikon("sarnic") + " " + esc(t("dFinal"));
      default: return ikon("bayrak") + " " + esc(t("dBitti")) + " · " + sureYaz(s.d.toplam);
    }
  };
  const eski = {};
  document.querySelectorAll(".e-satir").forEach((li) => (eski[li.dataset.n] = li.classList.contains("parla")));
  $("eListe").innerHTML = satir.map((s, i) => {
    const ad = s.k.ad ? esc(s.k.ad) : esc(t("takim")) + " " + esc(s.n);
    const bar = s.r.map((id) => { const a = (s.k.adimlar || {})[id] || {}; return "<i class=\"" + (a.bitis ? (artVar(s.n, id) ? "art" : "tamam") : "") + "\"></i>"; }).join("");
    return '<li class="e-satir' + (i === 0 && s.d.faz !== "baslamadi" ? " ilk" : "") + (eski[s.n] ? " parla" : "") + '" data-n="' + esc(s.n) + '" style="--renk:' + renk(s.n) + '">' +
      '<span class="e-sira-no">' + (i + 1) + '</span><span class="e-no">' + esc(s.n) + '</span><span class="e-ad"><b>' + ad + "</b><small>" + durumYazi(s) + "</small></span>" +
      '<span class="e-ilerleme">' + bar + '</span><span class="e-sayi"><b>' + s.art + "</b><small>" + esc(t("artefaktlar")) + '</small></span><span class="e-sayi"><b>' + s.puan + "</b><small>" + esc(t("puan")) + "</small></span></li>";
  }).join("");
}
function parlat(n) {
  const li = document.querySelector('.e-satir[data-n="' + n + '"]');
  if (!li) return;
  li.classList.remove("parla"); void li.offsetWidth; li.classList.add("parla");
  setTimeout(() => li.classList.remove("parla"), 2600);
}

// ---------- olaylar ve duyurular ----------
function olaylar() {
  const L2 = [];
  for (const n in TAKIMLAR) {
    const k = TAKIMLAR[n];
    if (!k || !k.baslangic) continue;
    for (const id in k.adimlar || {}) {
      const a = k.adimlar[id];
      if (a.varis) L2.push({ ts: a.varis, n, tur: "varis", id, anahtar: n + ":v:" + id });
      if (a.bitis) L2.push({ ts: a.bitis, n, tur: "bitis", id, anahtar: n + ":b:" + id });
    }
    for (const b in k.bonus || {}) for (const ts in k.bonus[b] || {}) L2.push({ ts: +ts, n, tur: "bonus", id: b, key: "b_" + b + "_" + ts, anahtar: n + ":x:" + b + ts });
    if (k.final) L2.push({ ts: k.final, n, tur: "final", anahtar: n + ":f" });
  }
  return L2.sort((a, b) => b.ts - a.ts);
}
function akisCiz(ol) {
  const ad = (o) => "<b>" + esc((kayit(o.n).ad) || t("takim") + " " + o.n) + "</b>";
  const ist = (id) => TL((VERI.istasyonlar[id] || VERI.yol_gorevleri[id] || {}).baslik);
  const metin = ol.slice(0, 12).map((o) => {
    if (o.tur === "varis") return "<span>" + saat(o.ts) + " · " + ad(o) + " — " + esc(ist(o.id)) + "</span>";
    if (o.tur === "bitis") return "<span>" + saat(o.ts) + " · " + ad(o) + " ✓ " + esc(ist(o.id)) + (artVar(o.n, o.id) ? " ★ " + esc(TL(VERI.istasyonlar[o.id].artefakt)) : "") + "</span>";
    if (o.tur === "bonus") return "<span>" + saat(o.ts) + " · " + ad(o) + " · " + esc(ist(o.id)) + "</span>";
    return "<span>" + saat(o.ts) + " · " + ad(o) + " · " + esc(t("dBitti")) + "</span>";
  }).join("");
  if ($("eAkis").dataset.icerik !== metin) { $("eAkis").innerHTML = metin; $("eAkis").dataset.icerik = metin; }
}
function duyurular(ol) {
  const anahtarlar = new Set(ol.map((o) => o.anahtar));
  if (gorulen === null) { gorulen = anahtarlar; return; }
  ol.slice().reverse().forEach((o) => {
    if (gorulen.has(o.anahtar)) return;
    if (o.tur === "bitis" || o.tur === "final") duyuruKuyruk.push(o);
    if (o.tur === "bitis" || o.tur === "varis" || o.tur === "final") parlat(o.n);
  });
  gorulen = anahtarlar;
  duyuruOynat();
}
function duyuruOynat() {
  if (duyuruSuruyor || !duyuruKuyruk.length) return;
  duyuruSuruyor = true;
  const o = duyuruKuyruk.shift(), d = $("eDuyuru"), ad = kayit(o.n).ad;
  if (o.tur === "final") {
    d.innerHTML = '<div class="d-ikon">' + ikon("sarnic") + "</div><p>" + esc(t("ekFinal", { n: o.n })) + "</p><h3>" + esc(ad || t("takim") + " " + o.n) + "</h3>";
  } else {
    const ist = VERI.istasyonlar[o.id], art = artVar(o.n, o.id);
    d.innerHTML = '<div class="d-ikon">' + noktaIkon(o.id) + "</div><p>" + esc(art ? t("ekArtefakt", { n: o.n }) : t("kutGorev")) + "</p><h3>" +
      esc(art ? TL(ist.artefakt) : TL(ist.baslik)) + "</h3><small>" + esc(ad || t("takim") + " " + o.n) + " · " + esc(TL(ist.baslik)) + "</small>";
  }
  d.style.setProperty("--renk", renk(o.n));
  d.classList.add("acik");
  setTimeout(() => { d.classList.remove("acik"); setTimeout(() => { duyuruSuruyor = false; duyuruOynat(); }, 700); }, 5500);
}

// ---------- fotoğraf gösterisi ----------
function fotoListesiKur() {
  const L2 = [];
  for (const n in KUCUK) {
    const k = kayit(n);
    for (const key in KUCUK[n] || {}) {
      let ts = 0, ad = "";
      const m = /^b_(.+)_(\d+)$/.exec(key);
      if (m) { ts = +m[2]; ad = TL((VERI.yol_gorevleri[m[1]] || {}).baslik); }
      else {
        const tam = /_tamam$/.test(key), id = key.replace(/_tamam$/, ""), a = (k.adimlar || {})[id] || {};
        ts = tam ? (a.foto2 || a.bitis || 0) : (a.foto || a.varis || 0);
        ad = TL((VERI.istasyonlar[id] || {}).baslik) + (tam ? " · ★ " + TL((VERI.istasyonlar[id] || {}).artefakt) : "");
      }
      L2.push({ n, key, ts, ad });
    }
  }
  L2.sort((a, b) => b.ts - a.ts);
  const yeni = L2.slice(0, 24);
  if (yeni.length && (!fotoListe.length || yeni[0].ts !== (fotoListe[0] || {}).ts)) fotoSira = 0;
  fotoListe = yeni;
  $("eFotoYok").classList.toggle("gizli", fotoListe.length > 0);
}
async function tamFoto(n, key) {
  const k = n + "/" + key;
  if (tamFotoOnbellek.has(k)) return tamFotoOnbellek.get(k);
  let src = (KUCUK[n] || {})[key];
  try { const b = await DB.get("foto/" + k); if (b) src = b; } catch (e) {}
  tamFotoOnbellek.set(k, src);
  return src;
}
async function fotoSonraki() {
  if (!fotoListe.length) return;
  const f = fotoListe[fotoSira % fotoListe.length];
  fotoSira++;
  const src = await tamFoto(f.n, f.key);
  const imgler = [$("eFoto"), $("eFoto2")];
  const yeni = imgler[1 - fotoAktif], eski = imgler[fotoAktif];
  yeni.onload = () => {
    yeni.classList.add("gor"); eski.classList.remove("gor"); fotoAktif = 1 - fotoAktif;
    $("eFotoYazi").innerHTML = '<span class="e-no" style="background:' + renk(f.n) + '">' + esc(f.n) + "</span>" + esc(kayit(f.n).ad || t("takim") + " " + f.n) + " · " + esc(f.ad) + " · " + saat(f.ts);
  };
  yeni.src = src;
}

// ---------- veri ----------
let cizimBekliyor = false;
function cizimIste() {
  if (cizimBekliyor) return;
  cizimBekliyor = true;
  requestAnimationFrame(() => {
    cizimBekliyor = false;
    siraCiz();
    const ol = olaylar();
    akisCiz(ol);
    duyurular(ol);
    fotoListesiKur();
  });
}
function saatCiz() {
  const simdi = Date.now();
  $("eSaat").textContent = new Date(simdi).toLocaleTimeString(DIL === "tr" ? "tr-TR" : "ru-RU", { hour: "2-digit", minute: "2-digit" });
  const ilk = Math.min(...takimNolari().map((n) => kayit(n).baslangic || Infinity));
  $("eGecen").textContent = isFinite(ilk) ? sureYaz(simdi - ilk) + " " + t("ekBasladi") : "";
}
function veriBaslat() {
  DB.izle("takimlar", (v) => { TAKIMLAR = v || {}; cizimIste(); });
  DB.izle("kucuk", (v) => { KUCUK = v || {}; cizimIste(); });
  DB.izle("yonetim", (v) => { YONETIM = v || {}; cizimIste(); });
  setInterval(() => { siraCiz(); saatCiz(); }, 1000);
  setInterval(fotoSonraki, 7000);
  setTimeout(fotoSonraki, 1500);
}

// ---------- akış ----------
function metinler() {
  document.title = t("ekranLink") + " · " + TL(VERI.etkinlik.ad);
  $("kapiBaslik").textContent = TL(VERI.etkinlik.ad);
  $("baslatBtn").textContent = t("ekBaslat");
  $("tamEkranBtn").textContent = t("ekTamEkran");
  $("eAlt").textContent = TL(VERI.etkinlik.alt);
  $("eBaslik").textContent = TL(VERI.etkinlik.ad);
  $("eSiraBaslik").textContent = t("ekSiralama");
  $("eFotoBaslik").textContent = t("ekFotolar");
  $("eFotoYok").textContent = t("ekFotoYok");
  $("eAkisBaslik").textContent = t("ekOlaylar");
}
function tamEkran() { const e = document.documentElement; if (e.requestFullscreen) e.requestFullscreen().catch(() => {}); }
function gosterimiBaslat() {
  tamEkran();
  $("kapi").classList.add("gizli");
  const intro = $("intro"), v = $("introVideo");
  intro.classList.remove("gizli");
  const bitir = () => { if (intro.classList.contains("bitti")) return; intro.classList.add("bitti"); $("ekran").classList.remove("gizli"); setTimeout(() => intro.classList.add("gizli"), 900); };
  v.addEventListener("ended", bitir);
  v.addEventListener("error", bitir);
  intro.onclick = bitir;
  setTimeout(bitir, 10000);
  const p = v.play();
  if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(bitir); });
  veriBaslat();
}
function hazir() {
  $("pinForm").classList.add("gizli");
  $("baslatBtn").classList.remove("gizli");
  $("baslatBtn").onclick = gosterimiBaslat;
  $("tamEkranBtn").onclick = tamEkran;
}

(async function () {
  try { await veriYukle(); } catch (e) { document.body.textContent = "data.json yüklenemedi"; return; }
  const q = new URLSearchParams(location.search).get("dil");
  dilDegistir(q === "tr" || q === "ru" ? q : "ru");
  metinler();
  if (await yoneticiOturumu()) { hazir(); return; }
  $("pinForm").classList.remove("gizli");
  $("pinGir").focus();
  pinFormuBagla($("pinForm"), async () => {
    let ok = false;
    try { ok = await yoneticiDogrula($("pinGir").value); } catch (e2) { $("pinHata").textContent = t("girisHata"); return; }
    if (!ok) { $("pinHata").textContent = t("pinHata"); return; }
    hazir();
  });
})();
