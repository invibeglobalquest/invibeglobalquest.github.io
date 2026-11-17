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
function normalize(s) { return String(s).replace(/\s+/g, "").toLocaleUpperCase("tr"); }
function sureSaniye() { return VERI.etkinlik.sure_dakika * 60; }
function kalanSaniye(d) {
  return Math.max(0, sureSaniye() - Math.floor((Date.now() - d.baslangic) / 1000));
}
function bicim(sn) {
  const m = Math.floor(sn / 60), s = sn % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
function senkronUrl() {
  const u = (VERI.etkinlik.senkron_url || "").trim().replace(/\/+$/, "");
  return u || null;
}
// Takımın durumunu ortak veritabanına gönderir (adres tanımlıysa)
function senkronGonder(d) {
  const kayit = {
    tamamlanan: d.tamamlanan.length,
    son: d.tamamlanan.length ? d.tamamlanan[d.tamamlanan.length - 1].ts : null,
    baslangic: d.baslangic || null
  };
  const u = senkronUrl();
  if (!u || !d.takim) return;
  fetch(u + "/takimlar/" + d.takim + ".json", {
    method: "PUT", body: JSON.stringify(kayit)
  }).catch(() => {});
}
