const ANAHTAR = "quest_durum";
let VERI = null;

async function veriYukle() {
  const r = await fetch("data.json?t=" + Date.now());
  if (!r.ok) throw new Error("data.json okunamadı");
  VERI = await r.json();
  return VERI;
}
function durumOku() {
  try { return JSON.parse(localStorage.getItem(ANAHTAR)) || {}; } catch (e) { return {}; }
}
function durumYaz(d) { try { localStorage.setItem(ANAHTAR, JSON.stringify(d)); } catch (e) {} }
function durumSil() { try { localStorage.removeItem(ANAHTAR); } catch (e) {} }

// Büyük/küçük harf, Türkçe karakter ve boşluk farkını yok sayar (ÇANTA = canta)
function normalize(s) {
  return String(s).toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}
function guvenliUrl(u) {
  u = (u || "").trim();
  return /^https?:\/\//i.test(u) ? u.replace(/"/g, "%22") : "";
}
function sureSaniye() { return VERI.etkinlik.sure_dakika * 60; }
function kalanSaniye(d) {
  return Math.max(0, sureSaniye() - Math.floor((Date.now() - d.baslangic) / 1000));
}
function bicim(sn) {
  const m = Math.floor(sn / 60), s = sn % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// ---- Ortak veritabanı (isteğe bağlı, Firebase Realtime Database REST) ----
function senkronUrl() {
  const u = (VERI.etkinlik.senkron_url || "").trim().replace(/\/+$/, "");
  return u || null;
}
async function uzakYama(yol, nesne) {            // PATCH: yalnızca verilen alanları günceller
  const u = senkronUrl();
  if (!u) return false;
  try {
    const r = await fetch(u + yol + ".json", { method: "PATCH", body: JSON.stringify(nesne) });
    return r.ok;
  } catch (e) { return false; }
}
async function uzakOku(yol) {
  const u = senkronUrl();
  if (!u) return undefined;
  try {
    const r = await fetch(u + yol + ".json?t=" + Date.now());
    if (!r.ok) return undefined;
    return await r.json();
  } catch (e) { return undefined; }
}
async function uzakYaz(yol, nesne) {              // PUT
  const u = senkronUrl();
  if (!u) return false;
  try {
    const r = await fetch(u + yol + ".json", { method: "PUT", body: JSON.stringify(nesne) });
    return r.ok;
  } catch (e) { return false; }
}
function senkronGonder(d) {
  if (!d.takim) return;
  uzakYama("/takimlar/" + d.takim, {
    tamamlanan: d.tamamlanan.length,
    son: d.tamamlanan.length ? d.tamamlanan[d.tamamlanan.length - 1].ts : null,
    baslangic: d.baslangic || null
  });
}

// ---- Puanlar (kontrolcü) ----
function puanAnahtar(t) { return "quest_puan_" + t; }
function yerelPuanOku(t) {
  try { return JSON.parse(localStorage.getItem(puanAnahtar(t))) || {}; } catch (e) { return {}; }
}
function yerelPuanYaz(t, p) { try { localStorage.setItem(puanAnahtar(t), JSON.stringify(p)); } catch (e) {} }
function toplamPuan(p) {
  let t = Number(p.ek) || 0;
  Object.values(p.istasyon || {}).forEach((v) => (t += Number(v) || 0));
  return t;
}

// ---- Fotoğraf: telefon fotoğrafını küçültüp JPEG data URL yapar ----
function fotoKucult(dosya, enBuyuk = 900, kalite = 0.7) {
  return new Promise((coz, red) => {
    const url = URL.createObjectURL(dosya), img = new Image();
    img.onload = () => {
      const o = Math.min(1, enBuyuk / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * o); c.height = Math.round(img.height * o);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      coz(c.toDataURL("image/jpeg", kalite));
    };
    img.onerror = () => { URL.revokeObjectURL(url); red(new Error("Fotoğraf okunamadı")); };
    img.src = url;
  });
}
function yerelFotoAnahtar(t, id) { return "quest_foto_" + t + "_" + id; }
