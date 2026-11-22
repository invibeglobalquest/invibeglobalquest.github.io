// Takım ekranı: lider (kodlu link) noktaları işaretler, diğer üyeler yalnızca izler
"use strict";

const A_DURUM = "kv_durum", A_KUYRUK = "kv_kuyruk", A_KUCUK = "kv_kucuk";
function oku(a, bos) { try { return JSON.parse(localStorage.getItem(a)) || bos; } catch (e) { return bos; } }
function yaz(a, v) { try { localStorage.setItem(a, JSON.stringify(v)); return true; } catch (e) { return false; } }

let durum = oku(A_DURUM, {});
let kucukler = oku(A_KUCUK, {});   // fotoğraf anahtarı -> küçük resim (data URL)
let kuyruk = oku(A_KUYRUK, []);    // sunucuya gidecek yazmalar
let yonetim = {};                  // yöneticinin verdiği puan / artefakt düzeltmeleri
let sonKonum = null;
let zamanlayici = null, yoklamaZ = null;
let sonFaz = "";

function durumYaz() { yaz(A_DURUM, durum); }
function kucukYaz() {
  if (!yaz(A_KUCUK, kucukler)) { /* depolama dolu: yalnızca bellekte kalır */ }
}
function rota() { return rotaAl(durum.takim, durum); }
function lider() { return durum.rol === "lider"; }
function liderKoduDogru(n, k) {
  const kod = (VERI.lider_kodlari || {})[n];
  return !!kod && String(k || "").replace(/\s+/g, "").toUpperCase() === String(kod).toUpperCase();
}

// ---------- Sunucu kuyruğu (internet kesilirse sonra gönderir) ----------
let isleniyor = false;
function kuyrukEkle(m, yol, govde, buyuk, isaret) {
  if (!DB.var()) return;
  kuyruk.push({ m, yol, govde, buyuk: !!buyuk, isaret });
  kuyrukYaz();
  kuyrukIsle();
}
function kuyrukYaz() {
  if (!yaz(A_KUYRUK, kuyruk)) yaz(A_KUYRUK, kuyruk.filter((k) => !k.buyuk));
}
async function kuyrukIsle() {
  if (isleniyor || !DB.var()) return senkronGoster();
  isleniyor = true;
  senkronGoster();
  try {
    while (kuyruk.length) {
      const k = kuyruk[0];
      await DB.istek(k.m, k.yol, k.govde);
      if (k.isaret === "basla" && durum.oturum === k.govde.oturum) { durum.sunucuda = true; durumYaz(); }
      kuyruk.shift();
      kuyrukYaz();
      senkronGoster();
    }
  } catch (e) {
    setTimeout(kuyrukIsle, 8000);
  } finally {
    isleniyor = false;
    senkronGoster();
  }
}
window.addEventListener("online", kuyrukIsle);
function senkronGoster() {
  const e = $("ustSenkron");
  if (!e) return;
  if (!lider()) e.textContent = "👁 " + (sonYenileme ? t("guncellendi", { x: saat(sonYenileme) }) : t("izleme"));
  else if (!DB.var()) e.textContent = t("snkYok");
  else if (kuyruk.length) e.textContent = "⟳ " + t("snkBekliyor", { n: kuyruk.length });
  else e.textContent = "✓ " + t("snkTamam");
}
function takimYolu(alt) { return "takimlar/" + durum.takim + (alt ? "/" + alt : ""); }

// ---------- Ekranlar ----------
function goster(ad) {
  ["giris", "hazir", "oyun", "bitis"].forEach((b) => $(b).classList.toggle("gizli", b !== ad));
  const ustVar = ad === "oyun" || ad === "bitis";
  $("ust").classList.toggle("gizli", !ustVar);
  $("ilerleme").classList.toggle("gizli", !ustVar);
}
function ekranAc() {
  clearInterval(zamanlayici);
  document.title = TL(VERI.etkinlik.ad);
  if (!durum.takim) { girisCiz(); goster("giris"); return; }
  if (!durum.baslangic) { hazirCiz(); goster("hazir"); return; }
  const d = durumHesapla(durum, rota());
  if (d.faz === "bitti") { bitisCiz(); goster("bitis"); }
  else { oyunCiz(); goster("oyun"); }
  ustCiz();
  tik();
  zamanlayici = setInterval(tik, 1000);
}
function yenidenCiz() { ekranAc(); }

function heroHTML(baslik) {
  return '<div class="hero"><div class="dil" id="dilKutu"></div>' +
    '<p class="hero-ust">' + esc(TL(VERI.etkinlik.alt)) + "</p>" +
    '<h1 class="hero-baslik">' + esc(baslik) + '</h1><div class="altin-cizgi"></div></div>';
}

function girisCiz() {
  const s = $("giris");
  let h = heroHTML(TL(VERI.etkinlik.ad));
  h += '<p class="not">👁 ' + esc(t("izleAcik")) + "</p>";
  h += '<h2 class="bolum-baslik">' + esc(t("takimSec")) + '</h2><div class="takimlar">';
  takimNolari().forEach((n) => {
    const ilk = VERI.rotalar[n][0];
    h += '<button type="button" class="takim-btn" data-takim="' + esc(n) + '"><b>' + esc(t("takim")) + " " + esc(n) +
      "</b><small>" + esc(t("ilkNokta", { x: noktaAdi(ilk) })) + "</small></button>";
  });
  h += "</div>";
  h += '<div class="kart lider-kart"><h3>⭐ ' + esc(t("liderMisin")) + '</h3><p class="soluk">' + esc(t("liderAcik")) + "</p>" +
    '<button type="button" class="btn ikincil kucuk" id="liderAcBtn">' + esc(t("kodGir")) + "</button>" +
    '<form id="liderForm" hidden><label class="alan">' + esc(t("takim")) + '<select id="liderTakim">' +
    takimNolari().map((n) => '<option value="' + esc(n) + '">' + esc(t("takim")) + " " + esc(n) + "</option>").join("") + "</select></label>" +
    '<label class="alan">' + esc(t("kod")) + '<input id="liderKod" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>' +
    '<p class="hata" id="liderHata" role="alert"></p><button type="submit" class="btn ana">' + esc(t("liderOl")) + "</button></form></div>";
  h += '<p class="alt-link"><a href="yonetici.html">🔒 ' + esc(t("yoneticiLink")) + "</a></p>";
  s.innerHTML = h;
  dilDugmeleri($("dilKutu"), yenidenCiz);
  s.querySelectorAll(".takim-btn").forEach((b) => (b.onclick = () => izleyiciSec(b.dataset.takim)));
  $("liderAcBtn").onclick = () => { $("liderForm").hidden = false; $("liderAcBtn").hidden = true; $("liderKod").focus(); };
  $("liderForm").onsubmit = (e) => {
    e.preventDefault();
    const n = $("liderTakim").value;
    if (!liderKoduDogru(n, $("liderKod").value)) { $("liderHata").textContent = t("kodHata"); return; }
    liderGiris(n);
  };
}

// Takım üyesi: yalnızca izler (sunucudan okur)
function izleyiciSec(n) {
  durum = { takim: n, rol: "izleyici" };
  kucukler = {};
  sonYenileme = 0;
  kucukYaz();
  durumYaz();
  ekranAc();
  window.scrollTo(0, 0);
  izleyiciYenile();
}
// Takım lideri: kodu doğru girildiyse işaretleme yetkisi
async function liderGiris(n) {
  if (durum.takim === n && lider()) { ekranAc(); return; }
  let k = null;
  if (DB.var()) { try { k = await DB.get("takimlar/" + n); } catch (e) {} }
  if (k && k.baslangic) { await sunucudanAl(n, k); return; }
  durum = { takim: n, rol: "lider", konumPaylas: true };
  kucukler = {};
  kucukYaz();
  durumYaz();
  ekranAc();
  window.scrollTo(0, 0);
}
async function sunucudanAl(n, k) {
  durum = {
    takim: n, rol: "lider", oturum: k.oturum || null, ad: k.ad || "", rota: Array.isArray(k.rota) ? k.rota : undefined,
    baslangic: k.baslangic, adimlar: k.adimlar || {}, final: k.final || null, bonus: k.bonus || {}, konumPaylas: true, sunucuda: true
  };
  try { kucukler = (await DB.get("kucuk/" + n)) || {}; } catch (e) { kucukler = {}; }
  kucukYaz();
  durumYaz();
  konumBaslat();
  ekranAc();
  window.scrollTo(0, 0);
}

function hazirCiz() {
  const s = $("hazir"), r = rota();
  let h = heroHTML(t("takim") + " " + durum.takim);
  h += '<div class="kart hikaye-kart"><p>' + esc(TL(VERI.giris_hikaye)) + "</p></div>";
  h += '<h2 class="bolum-baslik">' + esc(t("rota")) + '</h2><ol class="rota-liste">';
  h += '<li class="uc"><span class="no">◆</span><span>' + esc(t("baslangicN")) + ": " + esc(TL(VERI.baslangic.ad)) + "</span></li>";
  r.forEach((id, i) => {
    const n = VERI.istasyonlar[id];
    h += '<li><span class="no">' + (i + 1) + "</span><span>" + n.emoji + " " + esc(TL(n.baslik)) +
      "<small>" + esc(TL(n.yer)) + "</small></span></li>";
  });
  h += '<li class="uc"><span class="no">◆</span><span>' + esc(t("finalN")) + ": " + esc(TL(VERI.baslangic.ad)) + "</span></li></ol>";
  h += '<p class="not">⏱ ' + esc(t("kurallar", { y: VERI.etkinlik.yol_dk, g: VERI.etkinlik.gorev_dk })) + "</p>";
  if (!lider()) {
    h += '<div class="kart bekle-kart">⏳ ' + esc(t("bekleniyor")) + "</div>";
    h += '<button type="button" class="btn ikincil kucuk" id="degistirBtn">' + esc(t("degistir")) + "</button>";
    s.innerHTML = h;
    dilDugmeleri($("dilKutu"), yenidenCiz);
    $("degistirBtn").onclick = takimDegistir;
    return;
  }
  h += '<div class="izle-bant lider">⭐ ' + esc(t("liderBant")) + "</div>";
  h += '<label class="alan">' + esc(t("takimAdi")) + '<input id="takimAdi" maxlength="40" autocomplete="off" value="' + esc(durum.ad || "") + '"></label>';
  h += '<label class="onay"><input type="checkbox" id="konumPaylas"' + (durum.konumPaylas !== false ? " checked" : "") + "> " + esc(t("konumPaylas")) + "</label>";
  h += '<button type="button" class="btn ana" id="baslaBtn">▶ ' + esc(t("basla")) + "</button>";
  h += '<button type="button" class="btn ikincil kucuk" id="degistirBtn">' + esc(t("liderCikis")) + "</button>";
  s.innerHTML = h;
  dilDugmeleri($("dilKutu"), () => { durum.ad = $("takimAdi").value; yenidenCiz(); });
  $("baslaBtn").onclick = baslat;
  $("degistirBtn").onclick = takimDegistir;
}

function baslat() {
  if (!lider()) return;
  const simdi = Date.now();
  durum.ad = $("takimAdi").value.trim();
  durum.konumPaylas = $("konumPaylas").checked;
  durum.oturum = simdi.toString(36) + Math.random().toString(36).slice(2, 7);
  durum.baslangic = simdi;
  durum.adimlar = {};
  durum.bonus = {};
  durum.final = null;
  durum.rota = VERI.rotalar[durum.takim].slice();
  kucukler = {};
  kucukYaz();
  durumYaz();
  durum.sunucuda = false;
  kuyrukEkle("PUT", takimYolu(), { oturum: durum.oturum, ad: durum.ad, rota: durum.rota, baslangic: simdi, guncel: simdi }, false, "basla");
  kuyrukEkle("DELETE", "kucuk/" + durum.takim);
  kuyrukEkle("DELETE", "foto/" + durum.takim);
  kuyrukEkle("DELETE", "yonetim/" + durum.takim);
  konumBaslat();
  ekranAc();
  window.scrollTo(0, 0);
}

function takimDegistir() {
  if (lider() && !confirm(t(DB.var() ? "liderCikisOnay" : "degistirOnay"))) return;
  sifirlaYerel(false);
}
// kuyrukSil=false: gönderilmemiş kayıtlar yine de sunucuya gider
function sifirlaYerel(kuyrukSil) {
  clearInterval(zamanlayici);
  durum = {};
  kucukler = {};
  if (kuyrukSil) kuyruk = [];
  yonetim = {};
  sonYenileme = 0;
  durumYaz(); kucukYaz(); kuyrukYaz();
  ekranAc();
  window.scrollTo(0, 0);
}

// ---------- Oyun ekranı ----------
function ustCiz() {
  $("ustTakim").textContent = (lider() ? "⭐ " : "") + t("takim") + " " + durum.takim + (durum.ad ? " · " + durum.ad : "");
  $("ustToplamE").textContent = t("toplam");
  senkronGoster();
}

function gorevListesi(n) {
  return '<ul class="gorev-liste">' + TL(n.gorev).map((g) => "<li>" + esc(g) + "</li>").join("") + "</ul>";
}
function noktaDetayHTML(id) {
  const n = VERI.istasyonlar[id];
  let h = '<a class="btn harita" target="_blank" rel="noopener" href="' + haritaLink(n.lat, n.lng) + '">' + esc(t("konumaGit")) + "</a>";
  h += '<details class="hikaye"><summary>' + esc(t("hikaye")) + "</summary><p>" + esc(TL(n.hikaye)) + "</p></details>";
  h += '<h3 class="kucuk-baslik">' + esc(t("gorevB")) + "</h3>" + gorevListesi(n);
  if (n.kosul) h += '<p class="kosul">' + esc(TL(n.kosul)) + "</p>";
  h += '<div class="artefakt-kutu"><span>★</span><span><b>' + esc(t("artefakt")) + ":</b> " + esc(TL(n.artefakt)) + "</span></div>";
  return h;
}

function oyunCiz() {
  const s = $("oyun"), r = rota(), d = durumHesapla(durum, r);
  let h = lider() ? "" : '<div class="izle-bant">👁 ' + esc(t("izleyiciBant")) + "</div>";

  if (d.faz === "final") {
    const b = VERI.baslangic;
    h += '<div class="kart aktif-kart final-kart">' +
      '<div class="kart-ust"><span class="rozet">' + r.length + "/" + r.length + '</span><span class="faz-etiket" id="kartFaz"></span><span class="kart-sayac" id="kartSayac"></span></div>' +
      "<h2>🏛 " + esc(t("finalBaslik")) + "</h2>" +
      '<p class="yer">📍 ' + esc(TL(b.ad)) + '<span id="kartMesafe" class="mesafe"></span></p>' +
      "<p>" + esc(TL(VERI.final)) + "</p>" +
      '<a class="btn harita" target="_blank" rel="noopener" href="' + haritaLink(b.lat, b.lng) + '">' + esc(t("konumaGit")) + "</a>" +
      (lider() ? '<button type="button" class="btn ana" id="finalBtn">' + esc(t("finaleVardik")) + "</button>" : "") + "</div>";
  } else {
    const id = d.id, n = VERI.istasyonlar[id], a = (durum.adimlar || {})[id] || {};
    const [pb, ps] = planDilim(durum.baslangic, d.i);
    h += '<div class="kart aktif-kart">' +
      '<div class="kart-ust"><span class="rozet">' + (d.i + 1) + "/" + r.length + '</span><span class="faz-etiket" id="kartFaz"></span><span class="kart-sayac" id="kartSayac"></span></div>' +
      '<h2 class="nokta-baslik"><span class="emoji">' + n.emoji + "</span> " + (d.i + 1) + ". " + esc(TL(n.baslik)) + "</h2>" +
      '<p class="yer">📍 ' + esc(TL(n.yer)) + '<span id="kartMesafe" class="mesafe"></span></p>' +
      '<p class="plan">🕐 ' + esc(t("plan")) + " " + saat(pb) + "–" + saat(ps) + "</p>" +
      noktaDetayHTML(id);
    // Adım 1: fotoğraf (varış)
    h += '<div class="adim' + (a.varis ? " bitti" : "") + '"><div class="adim-no">1</div><div class="adim-ic">';
    if (!lider()) {
      h += a.varis
        ? '<div class="foto-satir">' + (kucukler[id] ? '<img class="foto-kucuk" data-foto="' + esc(id) + '" src="' + kucukler[id] + '" alt="">' : "") +
          "<div><b>✓ " + esc(t("varis", { s: saat(a.varis) })) + "</b></div></div>"
        : '<p class="soluk">' + esc(t("liderFotoBekle")) + "</p>";
      h += '</div></div><div class="adim' + (a.varis ? "" : " kilitli") + '"><div class="adim-no">2</div><div class="adim-ic"><p class="soluk">' +
        esc(t("liderBitirecek")) + "</p></div></div></div>";
    } else if (a.varis) {
      h += '<div class="foto-satir">' + (kucukler[id] ? '<img class="foto-kucuk" data-foto="' + esc(id) + '" src="' + kucukler[id] + '" alt="">' : "") +
        "<div><b>✓ " + esc(t("varis", { s: saat(a.varis) })) + "</b>" +
        (a.mesafe != null ? '<small class="soluk">' + esc(t("uzak", { m: a.mesafe })) + "</small>" : "") +
        '<label class="metin-btn">' + esc(t("fotoDegistir")) + '<input type="file" accept="image/*" class="foto-input" data-tur="nokta" data-id="' + esc(id) + '"></label></div></div>';
    } else {
      h += '<p class="soluk">' + esc(t("adimFoto")) + "</p>" +
        '<label class="btn ana foto-btn">' + esc(t("fotoCek")) + '<input type="file" accept="image/*" class="foto-input" data-tur="nokta" data-id="' + esc(id) + '"></label>';
    }
    // Adım 2: görev tamamlandı
    if (lider()) h += "</div></div>" + '<div class="adim' + (a.varis ? "" : " kilitli") + '"><div class="adim-no">2</div><div class="adim-ic">' +
      '<label class="onay"><input type="checkbox" id="artefaktAldik" checked' + (a.varis ? "" : " disabled") + "> " +
      esc(t("artefaktAldik", { a: TL(n.artefakt) })) + "</label>" +
      '<button type="button" class="btn yesil" id="tamamBtn"' + (a.varis ? "" : " disabled") + ">" + esc(t("tamamla")) + "</button>" +
      (a.varis ? "" : '<small class="soluk">' + esc(t("tamamlaOnce")) + "</small>") +
      "</div></div></div>";
  }

  // Tüm noktalar
  h += '<h2 class="bolum-baslik">' + esc(t("tumNoktalar")) + '</h2><div class="nokta-listesi">';
  r.forEach((id, i) => {
    const n = VERI.istasyonlar[id], a = (durum.adimlar || {})[id] || {};
    const [pb, ps] = planDilim(durum.baslangic, i);
    const sinif = a.bitis ? "tamam" : i === d.i ? "aktif" : "sirada";
    let sag = "";
    if (a.bitis) sag = (kucukler[id] ? '<img class="foto-mini" src="' + kucukler[id] + '" alt="">' : "") + '<span class="saat-yesil">✓ ' + saat(a.bitis) + "</span>";
    else if (i === d.i) sag = '<span class="simdi">●</span>';
    h += '<div class="nokta-satir ' + sinif + '" data-id="' + esc(id) + '">' +
      '<button type="button" class="nokta-bas" aria-expanded="false"><span class="no">' + (a.bitis ? "✓" : i + 1) + "</span>" +
      '<span class="nokta-ad">' + n.emoji + " " + esc(TL(n.baslik)) + "<small>" + esc(TL(n.yer)) + " · " + esc(t("plan")) + " " + saat(pb) + "–" + saat(ps) + "</small></span>" +
      '<span class="nokta-sag">' + sag + "</span></button>" +
      '<div class="nokta-detay" hidden>' +
      (a.bitis ? '<p class="zamanlar">' + esc(t("varis", { s: saat(a.varis) })) + " · " + esc(t("tamamlandi", { s: saat(a.bitis) })) + "</p>" +
        (kucukler[id] ? '<img class="foto-orta" data-foto="' + esc(id) + '" src="' + kucukler[id] + '" alt="">' : "") : "") +
      noktaDetayHTML(id) + "</div></div>";
  });
  h += "</div>";

  h += bonusHTML();
  h += '<button type="button" class="btn ikincil kucuk" id="degistirBtn">' + esc(t(lider() ? "liderCikis" : "degistir")) + "</button>";
  s.innerHTML = h;
  oyunBagla();
}

function bonusHTML() {
  let h = '<h2 class="bolum-baslik">' + esc(t("yolGorevleri")) + '</h2><p class="soluk">' + esc(t("yolGorevAcik")) + "</p>";
  for (const bid in VERI.yol_gorevleri) {
    const g = VERI.yol_gorevleri[bid];
    const ts = Object.keys((durum.bonus || {})[bid] || {}).sort();
    h += '<div class="kart bonus-kart"><h3>' + g.emoji + " " + esc(TL(g.baslik)) + "</h3><p>" + esc(TL(g.aciklama)) + "</p>" +
      '<div class="artefakt-kutu kucuk"><span>★</span><span>' + esc(TL(g.artefakt)) + "</span></div>";
    if (ts.length) {
      h += '<div class="foto-izgara">';
      ts.forEach((x) => {
        const k = "b_" + bid + "_" + x;
        h += kucukler[k] ? '<img class="foto-mini" data-foto="' + esc(k) + '" src="' + kucukler[k] + '" alt="">' : '<span class="foto-mini bos">📷</span>';
      });
      h += '</div><small class="soluk">' + esc(t("fotoSayisi", { n: ts.length })) + "</small>";
    }
    if (lider()) h += '<label class="btn ikincil foto-btn">' + esc(t("fotoEkle")) + '<input type="file" accept="image/*" class="foto-input" data-tur="bonus" data-id="' + esc(bid) + '"></label>';
    h += "</div>";
  }
  return h;
}

function fotoBaslik(k) {
  const m = /^b_(.+)_\d+$/.exec(k);
  return m ? TL((VERI.yol_gorevleri[m[1]] || {}).baslik) : noktaAdi(k);
}
function fotoBagla(s) {
  s.querySelectorAll(".foto-input").forEach((inp) => {
    inp.onchange = () => { if (inp.files && inp.files[0]) fotoSecildi(inp, inp.files[0], inp.dataset.tur, inp.dataset.id); };
  });
  s.querySelectorAll("img[data-foto]").forEach((img) => {
    img.onclick = () => fotoGoster(img.src, fotoBaslik(img.dataset.foto));
  });
}
function oyunBagla() {
  const s = $("oyun");
  fotoBagla(s);
  s.querySelectorAll(".nokta-bas").forEach((b) => {
    b.onclick = () => {
      const det = b.nextElementSibling, ac = det.hidden;
      det.hidden = !ac;
      b.setAttribute("aria-expanded", ac);
    };
  });
  const tb = $("tamamBtn");
  if (tb) tb.onclick = tamamla;
  const fb = $("finalBtn");
  if (fb) fb.onclick = finaleVar;
  $("degistirBtn").onclick = takimDegistir;
}

async function fotoSecildi(inp, dosya, tur, id) {
  if (!lider()) return;
  const etiket = inp.parentElement;
  const eski = etiket.firstChild.textContent;
  etiket.classList.add("yukleniyor");
  etiket.firstChild.textContent = t("fotoHazirlaniyor");
  let f;
  try { f = await fotoHazirla(dosya); }
  catch (e) {
    etiket.classList.remove("yukleniyor");
    etiket.firstChild.textContent = eski;
    alert(t("fotoHata"));
    return;
  }
  const ts = Date.now(), n = durum.takim;
  if (tur === "nokta") {
    durum.adimlar = durum.adimlar || {};
    const a = durum.adimlar[id] || (durum.adimlar[id] = {});
    if (!a.varis) a.varis = ts;
    a.foto = ts;
    const no = nokta(id);
    if (sonKonum && ts - sonKonum.ts < 120000) a.mesafe = mesafe(sonKonum, no);
    kucukler[id] = f.kucuk;
    kucukYaz();
    durumYaz();
    const p = { guncel: ts };
    p["adimlar/" + id + "/varis"] = a.varis;
    p["adimlar/" + id + "/foto"] = a.foto;
    p["adimlar/" + id + "/mesafe"] = a.mesafe ?? null;
    kuyrukEkle("PATCH", takimYolu(), p);
    kuyrukEkle("PUT", "kucuk/" + n + "/" + id, f.kucuk);
    kuyrukEkle("PUT", "foto/" + n + "/" + id, f.buyuk, true);
  } else {
    durum.bonus = durum.bonus || {};
    (durum.bonus[id] = durum.bonus[id] || {})[ts] = true;
    const k = "b_" + id + "_" + ts;
    kucukler[k] = f.kucuk;
    kucukYaz();
    durumYaz();
    const p = { guncel: ts };
    p["bonus/" + id + "/" + ts] = true;
    kuyrukEkle("PATCH", takimYolu(), p);
    kuyrukEkle("PUT", "kucuk/" + n + "/" + k, f.kucuk);
    kuyrukEkle("PUT", "foto/" + n + "/" + k, f.buyuk, true);
  }
  const y = window.scrollY;
  if ($("bitis").classList.contains("gizli")) oyunCiz(); else bitisCiz();
  window.scrollTo(0, y);
  tik();
}

function tamamla() {
  if (!lider()) return;
  const d = durumHesapla(durum, rota());
  if (d.faz !== "gorev") return;
  const id = d.id, a = durum.adimlar[id];
  if (!confirm(t("tamamla").replace(/^✅\s*/, "") + ": " + noktaAdi(id) + "?")) return;
  a.bitis = Date.now();
  a.artefakt = $("artefaktAldik").checked;
  durumYaz();
  const p = { guncel: a.bitis };
  p["adimlar/" + id + "/bitis"] = a.bitis;
  p["adimlar/" + id + "/artefakt"] = a.artefakt;
  kuyrukEkle("PATCH", takimYolu(), p);
  if (navigator.vibrate) navigator.vibrate(80);
  ekranAc();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function finaleVar() {
  if (!lider()) return;
  if (!confirm(t("finaleVardik").replace(/^\S+\s*/, "") + "?")) return;
  durum.final = Date.now();
  durumYaz();
  kuyrukEkle("PATCH", takimYolu(), { final: durum.final, guncel: durum.final });
  ekranAc();
  window.scrollTo(0, 0);
}

// ---------- Bitiş ----------
function artefaktVar(id) {
  const y = (yonetim || {})[id];
  if (y && typeof y.artefakt === "boolean") return y.artefakt;
  return !!((durum.adimlar || {})[id] || {}).artefakt;
}
function toplamPuan() {
  let p = 0;
  for (const k in yonetim || {}) p += +((yonetim[k] || {}).puan || 0);
  return p;
}
function bitisCiz() {
  const s = $("bitis"), r = rota();
  const alinan = r.filter(artefaktVar);
  let h = heroHTML(t("bitti"));
  h += '<div class="kart ozet-kart"><div><small>' + esc(t("toplamSure")) + "</small><b>" + sureYaz(durum.final - durum.baslangic) + "</b></div>" +
    "<div><small>" + esc(t("artefaktlar")) + "</small><b>" + alinan.length + "/" + r.length + "</b></div>" +
    "<div><small>" + esc(t("puan")) + '</small><b id="bitisPuan">' + toplamPuan() + "</b></div></div>";
  h += '<div class="kart"><p>' + esc(TL(VERI.final)) + '</p><ul class="artefakt-liste">';
  r.forEach((id) => {
    const n = VERI.istasyonlar[id];
    h += '<li class="' + (artefaktVar(id) ? "var" : "yok") + '">' + (artefaktVar(id) ? "★" : "☆") + " " + esc(TL(n.artefakt)) + " <small>· " + esc(TL(n.baslik)) + "</small></li>";
  });
  h += "</ul></div>";
  const fotolar = r.filter((id) => kucukler[id]);
  if (fotolar.length) {
    h += '<div class="foto-izgara buyuk">' + fotolar.map((id) => '<img class="foto-mini" data-foto="' + esc(id) + '" src="' + kucukler[id] + '" alt="">').join("") + "</div>";
  }
  h += bonusHTML();
  h += '<button type="button" class="btn ikincil kucuk" id="degistirBtn">' + esc(t(lider() ? "liderCikis" : "degistir")) + "</button>";
  s.innerHTML = h;
  dilDugmeleri($("dilKutu"), yenidenCiz);
  fotoBagla(s);
  $("degistirBtn").onclick = takimDegistir;
}

// ---------- Sayaç ----------
function tik() {
  if (!durum.baslangic) return;
  const r = rota(), simdi = Date.now(), d = durumHesapla(durum, r, simdi);
  const sayac = $("ustSayac"), faz = $("ustFaz");
  $("ilerleme").firstElementChild.style.width = (100 * d.tamam / r.length) + "%";
  if (d.faz === "bitti") {
    faz.textContent = t("fazBitti");
    sayac.textContent = "🏁";
    sayac.className = "";
    $("ustToplam").textContent = sureYaz(d.toplam);
    return;
  }
  $("ustToplam").textContent = sureYaz(simdi - durum.baslangic);
  const etiket = d.faz === "yol" ? t("fazYol") : d.faz === "gorev" ? t("fazGorev") : t("fazFinal");
  const metin = sureYaz(d.kalan);
  faz.textContent = etiket + " · " + VERI.etkinlik[d.faz === "gorev" ? "gorev_dk" : "yol_dk"] + " " + t("dk");
  sayac.textContent = metin;
  const sinif = d.kalan < 0 ? "gec" : d.kalan < 120000 ? "az" : "";
  sayac.className = sinif;
  const kf = $("kartFaz"), ks = $("kartSayac");
  if (kf) kf.textContent = etiket;
  if (ks) { ks.textContent = d.kalan < 0 ? metin + " " + t("gecikme") : metin; ks.className = "kart-sayac " + sinif; }
  // süre dolduğu an titreşim
  const anahtar = d.faz + d.i;
  if (d.kalan < 0 && sonFaz === anahtar + "+") { /* zaten bildirildi */ }
  else if (d.kalan < 0 && sonFaz === anahtar) { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); sonFaz = anahtar + "+"; }
  else if (d.kalan >= 0) sonFaz = anahtar;
  // hedefe uzaklık
  const km = $("kartMesafe");
  if (km) {
    const hedef = d.faz === "final" ? VERI.baslangic : nokta(d.id);
    km.textContent = sonKonum && simdi - sonKonum.ts < 120000 ? " · ≈ " + mesafe(sonKonum, hedef) + " m" : "";
  }
}

// ---------- Konum paylaşımı ----------
let konumIzleId = null, sonGonderim = 0, sonGonderilen = null;
function konumBaslat() {
  if (!lider() || durum.konumPaylas === false || !navigator.geolocation || konumIzleId !== null || !durum.baslangic) return;
  konumIzleId = navigator.geolocation.watchPosition((p) => {
    const simdi = Date.now();
    sonKonum = { lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy), ts: simdi };
    const uzak = sonGonderilen ? mesafe(sonGonderilen, sonKonum) : Infinity;
    if (DB.var() && durum.takim && (simdi - sonGonderim > 20000 || (uzak > 30 && simdi - sonGonderim > 5000))) {
      sonGonderim = simdi;
      sonGonderilen = sonKonum;
      DB.put(takimYolu("konum"), sonKonum).catch(() => {});
    }
  }, () => {}, { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 });
}

// ---------- Yöneticiyle eşitleme ----------
let sonKonumAyar, sonYenileme = 0, yoklamaSay = 0;
// Ekranı yeniden çizer; kaydırma yerini ve açık noktaları korur
function yerindeCiz() {
  const y = window.scrollY;
  const acik = Array.from(document.querySelectorAll(".nokta-satir")).filter((x) => !x.querySelector(".nokta-detay").hidden).map((x) => x.dataset.id);
  ekranAc();
  acik.forEach((id) => {
    const x = document.querySelector('.nokta-satir[data-id="' + id + '"]');
    if (x) { x.querySelector(".nokta-detay").hidden = false; x.querySelector(".nokta-bas").setAttribute("aria-expanded", "true"); }
  });
  window.scrollTo(0, y);
}
// Yöneticinin değiştirdiği nokta konumlarını alır; değiştiyse true
async function konumAyarKontrol(kn) {
  if (kn === undefined) { try { kn = await DB.get("ayarlar/konumlar"); } catch (e) { return false; } }
  const kj = JSON.stringify(kn || null);
  if (kj === sonKonumAyar) return false;
  const ilk = sonKonumAyar === undefined;
  sonKonumAyar = kj;
  await konumlariUygula(kn || null);
  return !ilk;
}
function yenile() { if (lider()) yokla(); else izleyiciYenile(); }

function izOzet(d) {
  return JSON.stringify([d.ad || "", d.rota || null, d.oturum || null, d.baslangic || null, d.adimlar || {}, d.final || null, d.bonus || {}]);
}
function gerekenFotolar() {
  const k = [];
  for (const id in durum.adimlar || {}) if (durum.adimlar[id].foto || durum.adimlar[id].varis) k.push(id);
  for (const b in durum.bonus || {}) for (const x in durum.bonus[b] || {}) k.push("b_" + b + "_" + x);
  return k;
}
async function izleyiciYenile() {
  if (lider() || !durum.takim || !DB.var()) return;
  const n = durum.takim;
  let k;
  try { k = await DB.get("takimlar/" + n); } catch (e) { senkronGoster(); return; }
  if (durum.takim !== n || lider()) return;
  sonYenileme = Date.now();
  k = k || {};
  const yeni = {
    takim: n, rol: "izleyici", ad: k.ad || "", rota: Array.isArray(k.rota) ? k.rota : undefined, oturum: k.oturum || null,
    baslangic: k.baslangic || null, adimlar: k.adimlar || {}, final: k.final || null, bonus: k.bonus || {}
  };
  let degisti = izOzet(yeni) !== izOzet(durum);
  if (yeni.oturum !== durum.oturum) kucukler = {};
  durum = yeni;
  durumYaz();
  const eksik = gerekenFotolar().filter((x) => !kucukler[x]);
  if (eksik.length) {
    const gelen = await Promise.all(eksik.map((x) => DB.get("kucuk/" + n + "/" + x).catch(() => null)));
    gelen.forEach((v, i) => { if (v) { kucukler[eksik[i]] = v; degisti = true; } });
    kucukYaz();
  }
  if (durum.final) {
    try {
      const yn = (await DB.get("yonetim/" + n)) || {};
      if (JSON.stringify(yn) !== JSON.stringify(yonetim)) { yonetim = yn; degisti = true; }
    } catch (e) {}
  }
  if (yoklamaSay++ % 4 === 0 && await konumAyarKontrol()) degisti = true;
  if (degisti) yerindeCiz(); else senkronGoster();
}

async function yokla() {
  if (!DB.var() || !durum.takim || !durum.baslangic || !lider()) return;
  try {
    const n = durum.takim;
    const [ot, yn, kn] = await Promise.all([DB.get("takimlar/" + n + "/oturum"), DB.get("yonetim/" + n), DB.get("ayarlar/konumlar")]);
    if (await konumAyarKontrol(kn) && !$("oyun").classList.contains("gizli")) yerindeCiz();
    if (ot === null && durum.sunucuda && kuyruk.length === 0 && !isleniyor) {
      alert(t("sifirlandi"));
      sifirlaYerel(true);
      return;
    }
    if (ot && durum.oturum && ot !== durum.oturum) {
      const k = await DB.get("takimlar/" + n);
      if (k) await sunucudanAl(n, k);
      return;
    }
    const eski = JSON.stringify(yonetim);
    yonetim = yn || {};
    if (eski !== JSON.stringify(yonetim) && !$("bitis").classList.contains("gizli")) bitisCiz();
  } catch (e) {}
}

// ---------- Başlat ----------
(async function () {
  try { await veriYukle(); }
  catch (e) {
    $("ana").innerHTML = '<div class="kart"><h2>⚠</h2><p>' + esc(t("veriYok")) + "</p></div>";
    return;
  }
  dilDegistir(DIL);
  if (durum.takim && (!VERI.rotalar[durum.takim] || !durum.rol)) durum = {};
  // Lider linki: ?t=3&k=KOD  ·  Takım izleme linki: ?t=3
  const q = new URLSearchParams(location.search);
  const qn = q.get("t"), qk = q.get("k");
  if (qn) history.replaceState(null, "", location.pathname);
  if (qn && VERI.rotalar[qn]) {
    if (qk && liderKoduDogru(qn, qk)) { await liderGiris(qn); }
    else if (qk) { alert(t("linkHata")); durum = {}; ekranAc(); }
    else if (durum.takim !== qn) izleyiciSec(qn);
    else ekranAc();
  } else ekranAc();
  konumBaslat();
  kuyrukIsle();
  yenile();
  yoklamaZ = setInterval(yenile, 15000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { tik(); kuyrukIsle(); yenile(); }
  });
})();
