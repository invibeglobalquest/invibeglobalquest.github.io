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
function etiketli(ad, metin) { return ikon(ad) + '<span class="et">' + esc(metin) + "</span>"; }

// ---------- Sunucu kuyruğu (internet kesilirse sonra gönderir) ----------
// İki hat: küçük kayıtlar (varış, tamamlandı, konum) ve büyük fotoğraflar ayrı ayrı gider;
// zayıf şebekede yavaş yüklenen bir fotoğraf, sıradaki noktanın kaydını bekletmez.
const hat = { kucuk: false, buyuk: false };
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
function kuyrukIsle() { hatIsle(false); hatIsle(true); }
function kuyruktanCikar(k) {
  const i = kuyruk.indexOf(k);
  if (i >= 0) { kuyruk.splice(i, 1); kuyrukYaz(); }
}
// iki istek aynı yeri etkiliyor mu (aynı yol ya da biri ötekinin üst dalı)
function yolCakisir(a, b) { return a === b || a.startsWith(b + "/") || b.startsWith(a + "/"); }
async function hatIsle(buyuk) {
  const ad = buyuk ? "buyuk" : "kucuk";
  // güvenli modda yalnızca oturumu olan lider gönderir (kod yeniden girilince bekleyenler gider)
  if (hat[ad] || !DB.var() || (GUVEN.aktif() && !(lider() && liderOturumuVar(durum.takim)))) return senkronGoster();
  hat[ad] = true;
  isleniyor = true;
  senkronGoster();
  let k = null;
  try {
    while ((k = kuyruk.find((x) => !!x.buyuk === buyuk))) {
      // Öbür hatta daha önce sıraya girmiş ve aynı yeri etkileyen istek varsa önce o gitsin:
      // ör. Başlat'taki "eski fotoğrafları sil" isteği, yeni fotoğraftan sonra gidip onu silmesin.
      const sira = kuyruk.indexOf(k);
      if (kuyruk.slice(0, sira).some((x) => !!x.buyuk !== buyuk && yolCakisir(x.yol, k.yol))) { k = null; break; }
      await DB.istek(k.m, k.yol, k.govde, buyuk ? 90000 : 20000);
      if (k.isaret === "basla" && durum.oturum === k.govde.oturum) { durum.sunucuda = true; durumYaz(); }
      kuyruktanCikar(k);
      senkronGoster();
      // bu istek öbür hattın beklediği istek olabilir: öbür hattı uyandır
      setTimeout(() => hatIsle(!buyuk), 0);
    }
  } catch (e) {
    // izin hatası (güvenli modda yetkisiz yazma) kuyruğu tıkamasın
    if (/HTTP 40[13]/.test(e.message || "")) { kuyruktanCikar(k); setTimeout(() => hatIsle(buyuk), 100); }
    else setTimeout(() => hatIsle(buyuk), 8000);
  } finally {
    hat[ad] = false;
    isleniyor = hat.kucuk || hat.buyuk;
    senkronGoster();
  }
}
window.addEventListener("online", kuyrukIsle);
function senkronGoster() {
  const e = $("ustSenkron");
  if (!e) return;
  if (!lider()) e.textContent = (sonYenileme ? t("guncellendi", { x: saat(sonYenileme) }) : t("izleme"));
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
  // gizli ekranlarda eski içerik kalmasın (aynı kimlikli düğmeler yanlış yere bağlanıyordu)
  ["giris", "hazir", "oyun", "bitis"].forEach((b) => { $(b).innerHTML = ""; });
  document.title = TL(VERI.etkinlik.ad) + " · Invibe Global";
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
function aktifeKaydir(yumusak) {
  const k = $("aktifKart");
  if (k) k.scrollIntoView({ behavior: yumusak ? "smooth" : "auto", block: "start" });
}
document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-geri]"); if (b) geriGit(); });

function geriDugme() { return '<button type="button" class="hero-geri" data-geri="1">' + ikon("ok", "ters") + "<span>" + esc(t("geri")) + "</span></button>"; }
function heroHTML(baslik, sayi, geri) {
  return '<div class="hero">' + (geri ? geriDugme() : '<div class="marka"><img src="medya/logo-mini.webp" alt="Invibe Global" width="64" height="60"></div>') + '<div class="dil" id="dilKutu"></div>' + kemerSVG() +
    '<p class="hero-ust">' + esc(TL(VERI.etkinlik.alt)) + "</p>" +
    '<h1 class="hero-baslik">' + esc(baslik) + (sayi ? ' <span class="sayi">' + esc(sayi) + "</span>" : "") + '</h1><div class="altin-cizgi"></div></div>';
}

function girisCiz() {
  const s = $("giris");
  let h = heroHTML(TL(VERI.etkinlik.ad));
  h += '<p class="not ikonlu">' + ikon("goz") + "<span>" + esc(t("izleAcik")) + "</span></p>";
  h += '<h2 class="bolum-baslik">' + esc(t("takimSec")) + '</h2><div class="takimlar">';
  takimNolari().forEach((n) => {
    const ilk = VERI.rotalar[n][0];
    h += '<button type="button" class="takim-btn" data-takim="' + esc(n) + '"><span class="tb-ust"><b>' + esc(t("takim")) + " " + esc(n) +
      "</b>" + noktaIkon(ilk) + "</span><small>" + esc(t("ilkNokta", { x: noktaAdi(ilk) })) + "</small></button>";
  });
  h += "</div>";
  h += '<div class="kart lider-kart"><h3>' + ikon("yildiz") + " " + esc(t("liderMisin")) + '</h3><p class="soluk">' + esc(t("liderAcik")) + "</p>" +
    '<button type="button" class="btn ikincil kucuk" id="liderAcBtn">' + esc(t("kodGir")) + "</button>" +
    '<form id="liderForm" hidden><label class="alan">' + esc(t("takim")) + '<select id="liderTakim">' +
    takimNolari().map((n) => '<option value="' + esc(n) + '">' + esc(t("takim")) + " " + esc(n) + "</option>").join("") + "</select></label>" +
    '<label class="alan">' + esc(t("kod")) + '<input id="liderKod" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>' +
    '<p class="hata" id="liderHata" role="alert"></p><button type="submit" class="btn ana">' + esc(t("liderOl")) + "</button></form></div>";
  h += '<p class="alt-link"><a href="yonetici.html">' + ikon("kilit") + " " + esc(t("yoneticiLink")) + "</a></p>" + markaAlt();
  s.innerHTML = h;
  dilDugmeleri($("dilKutu"), yenidenCiz);
  s.querySelectorAll(".takim-btn").forEach((b) => (b.onclick = () => izleyiciSec(b.dataset.takim)));
  $("liderAcBtn").onclick = () => { $("liderForm").hidden = false; $("liderAcBtn").hidden = true; $("liderKod").focus(); };
  $("liderForm").onsubmit = async (e) => {
    e.preventDefault();
    const n = $("liderTakim").value;
    let ok = false;
    try { ok = await liderDogrula(n, $("liderKod").value); } catch (e2) { $("liderHata").textContent = t("girisHata"); return; }
    if (!ok) { $("liderHata").textContent = t("kodHata"); return; }
    liderGiris(n);
  };
}

// Takım üyesi: yalnızca izler (sunucudan okur)
// ---------- Bu cihazda liderlik hatırlanır (Geri'ye basmak liderliği düşürmez) ----------
const A_LIDERLER = "kv_liderler", A_YEDEK = "kv_lider_yedek";
function liderler() { const l = oku(A_LIDERLER, []); return Array.isArray(l) ? l : []; }
// Güvenli modda lider sayılmak için o takımın Firebase oturumu gerekir
function liderOturumuVar(n) {
  if (!GUVEN.aktif()) return true;
  const o = GUVEN.oku();
  return !!o && o.email === GUVEN.eposta("lider", n);
}
function liderMi(n) { return liderler().includes(String(n)) && liderOturumuVar(n); }
function liderHatirla(n) { const l = liderler(); if (!l.includes(String(n))) { l.push(String(n)); yaz(A_LIDERLER, l); } }
function liderUnut(n) { yaz(A_LIDERLER, liderler().filter((x) => x !== String(n))); try { localStorage.removeItem(A_YEDEK); } catch (e) {} }
// Geri: seçim ekranına dön; lider ilerlemesi saklanır, aynı takım seçilince kaldığı yerden devam eder
function geriGit() {
  if (lider() && durum.takim) yaz(A_YEDEK, { durum, kucukler });
  sifirlaYerel(false);
}
function izleyiciSec(n) {
  if (liderMi(n)) { liderGiris(n); return; }
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
  liderHatirla(n);
  if (durum.takim === n && lider()) { ekranAc(); return; }
  const yedek = oku(A_YEDEK, null);
  if (yedek && yedek.durum && yedek.durum.takim === n && yedek.durum.rol === "lider") {
    durum = yedek.durum;
    kucukler = yedek.kucukler || {};
    try { localStorage.removeItem(A_YEDEK); } catch (e) {}
    durumYaz(); kucukYaz();
    konumBaslat();
    ekranAc();
    window.scrollTo(0, 0);
    yokla();
    kuyrukIsle();
    return;
  }
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
    takim: n, rol: "lider", oturum: k.oturum || null, duzeltme: k.duzeltme || 0, ad: k.ad || "", rota: Array.isArray(k.rota) ? k.rota : undefined,
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
  let h = heroHTML(t("takim"), durum.takim, true);
  h += '<div class="kart hikaye-kart"><p>' + esc(TL(VERI.giris_hikaye)) + "</p>" + dinleBtn(TL(VERI.giris_hikaye)) + "</div>";
  h += '<h2 class="bolum-baslik">' + esc(t("rota")) + '</h2><ol class="rota-liste">';
  h += '<li class="uc"><span class="no">◆</span><span>' + esc(t("baslangicN")) + ": " + esc(TL(VERI.baslangic.ad)) + "</span></li>";
  r.forEach((id, i) => {
    const n = VERI.istasyonlar[id];
    h += '<li><span class="no">' + (i + 1) + '</span><span class="r-ikon">' + noktaIkon(id) + "</span><span>" + esc(TL(n.baslik)) +
      "<small>" + esc(TL(n.yer)) + "</small></span></li>";
  });
  h += '<li class="uc"><span class="no">◆</span><span>' + esc(t("finalN")) + ": " + esc(TL(VERI.baslangic.ad)) + "</span></li></ol>";
  h += '<p class="not ikonlu">' + ikon("saat") + "<span>" + esc(t("kurallar", { d: noktaDk() })) + "</span></p>";
  if (!lider()) {
    h += '<div class="kart bekle-kart ikonlu">' + ikon("oyun") + "<span>" + esc(t("bekleniyor")) + "</span></div>" + izleBantHTML();
    h += '<button type="button" class="btn ikincil kucuk" id="degistirBtn">' + esc(t("degistir")) + "</button>";
    s.innerHTML = h;
    dilDugmeleri($("dilKutu"), yenidenCiz);
    dinleBagla(s);
    $("degistirBtn").onclick = takimDegistir;
    return;
  }
  h += '<div class="izle-bant lider">' + ikon("yildiz") + " " + esc(t("liderBant")) + "</div>";
  h += '<label class="alan">' + esc(t("takimAdi")) + '<input id="takimAdi" maxlength="40" autocomplete="off" value="' + esc(durum.ad || "") + '"></label>';
  h += '<label class="onay"><input type="checkbox" id="konumPaylas"' + (durum.konumPaylas !== false ? " checked" : "") + "> " + esc(t("konumPaylas")) + "</label>";
  h += '<button type="button" class="btn ana" id="baslaBtn">' + etiketli("baslat", t("basla")) + "</button>";
  h += '<button type="button" class="btn ikincil kucuk" id="degistirBtn">' + esc(t("liderCikis")) + "</button>";
  s.innerHTML = h;
  dilDugmeleri($("dilKutu"), () => { durum.ad = $("takimAdi").value; yenidenCiz(); });
  dinleBagla(s);
  $("baslaBtn").onclick = baslat;
  $("degistirBtn").onclick = takimDegistir;
}

function baslat() {
  if (!lider()) return;
  if (!confirm(t("baslaOnay"))) return;
  sesAc();
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
  if (!GUVEN.aktif()) kuyrukEkle("DELETE", "yonetim/" + durum.takim);
  konumBaslat();
  ekranAc();
  ekranAcikTut();
  window.scrollTo(0, 0);
}

function takimDegistir() {
  if (lider() && !confirm(t(DB.var() ? "liderCikisOnay" : "degistirOnay"))) return;
  if (lider()) liderUnut(durum.takim);
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
function fotoIkili(id) {
  const f = (k, et) => kucukler[k] ? '<figure><img class="foto-orta" data-foto="' + esc(k) + '" src="' + kucukler[k] + '" alt=""><figcaption>' + esc(et) + "</figcaption></figure>" : "";
  const h = f(id, t("foto1")) + f(id + "_tamam", t("foto2"));
  return h ? '<div class="foto-ikili">' + h + "</div>" : "";
}
function ustCiz() {
  $("geriBtn").setAttribute("aria-label", t("geri"));
  $("geriBtn").onclick = geriGit;
  $("ustTakim").textContent = (lider() ? "★ " : "") + t("takim") + " " + durum.takim + (durum.ad ? " · " + durum.ad : "");
  $("ustToplamE").textContent = t("toplam");
  senkronGoster();
}

function gorevListesi(n) {
  return '<ul class="gorev-liste">' + TL(n.gorev).map((g) => "<li>" + esc(g) + "</li>").join("") + "</ul>";
}
function noktaDetayHTML(id) {
  const n = VERI.istasyonlar[id];
  let h = '<a class="btn harita" target="_blank" rel="noopener" href="' + haritaLink(n.lat, n.lng) + '">' + etiketli("konum", t("konumaGit")) + "</a>";
  h += '<details class="hikaye"><summary>' + esc(t("hikaye")) + "</summary><p>" + esc(TL(n.hikaye)) + "</p>" + dinleBtn(TL(n.hikaye)) + "</details>";
  h += '<h3 class="kucuk-baslik">' + esc(t("gorevB")) + "</h3>" + gorevListesi(n);
  if (n.kosul) h += '<p class="kosul">' + esc(TL(n.kosul)) + "</p>";
  h += '<div class="artefakt-kutu">' + ikon("yildiz") + "<span><b>" + esc(t("artefakt")) + ":</b> " + esc(TL(n.artefakt)) + "</span></div>";
  return h;
}

function oyunCiz() {
  const s = $("oyun"), r = rota(), d = durumHesapla(durum, r);
  let h = lider() ? "" : izleBantHTML();
  h += koleksiyonHTML();
  // Sıradaki nokta, listede kendi yerinde düğmeleriyle açık durur (ayrı üst kart yok)
  const hOnce = h;
  h = "";
  if (d.faz === "final") {
    const b = VERI.baslangic, son = nokta(r[r.length - 1]);
    // son noktası bitişle aynı yerde olan takım (ör. Hanımın Oyunu → Sarnıç) yürümez
    const bitiste = !!son && mesafe(son, b) < 80;
    h += '<div class="kart aktif-kart final-kart" id="aktifKart">' +
      '<div class="kart-ust"><span class="rozet">' + r.length + "/" + r.length + '</span><span class="faz-etiket" id="kartFaz"></span><span class="kart-sayac" id="kartSayac"></span></div>' +
      '<h2 class="nokta-baslik"><span class="emoji">' + ikon("sarnic") + "</span> " + esc(t("finalBaslik")) + "</h2>" +
      '<p class="yer">' + ikon("konum") + " " + esc(TL(b.ad)) + '<span id="kartMesafe" class="mesafe"></span></p>' +
      "<p>" + esc(TL(VERI.final)) + "</p>" +
      (bitiste ? '<div class="bekle-not" role="status">' + ikon("bayrak") + "<div><b>" + esc(t("bitisteSiniz")) + "</b></div></div>"
        : '<a class="btn harita" target="_blank" rel="noopener" href="' + haritaLink(b.lat, b.lng) + '">' + etiketli("konum", t("konumaGit")) + "</a>") +
      (lider() ? '<button type="button" class="btn ana" id="finalBtn">' + etiketli("bayrak", t("finaleVardik")) + "</button>" : "") + "</div>";
  } else {
    const id = d.id, n = VERI.istasyonlar[id], a = (durum.adimlar || {})[id] || {};
    const [pb, ps] = planDilim(durum.baslangic, d.i);
    h += '<div class="kart aktif-kart" id="aktifKart">' +
      '<div class="kart-ust"><span class="rozet">' + (d.i + 1) + "/" + r.length + '</span><span class="faz-etiket" id="kartFaz"></span><span class="kart-sayac" id="kartSayac"></span></div>' +
      '<h2 class="nokta-baslik"><span class="emoji">' + noktaIkon(id) + "</span> " + (d.i + 1) + ". " + esc(TL(n.baslik)) + "</h2>" +
      '<p class="yer">' + ikon("konum") + " " + esc(TL(n.yer)) + '<span id="kartMesafe" class="mesafe"></span></p>' +
      '<p class="plan">' + ikon("saat") + " " + esc(t("plan")) + " " + saat(pb) + "–" + saat(ps) + "</p>" +
      (d.faz === "bekle" ? '<div class="bekle-not" role="status">' + ikon("saat") + "<div><b>" + esc(t("bekleBaslik")) + "</b><p>" + esc(t("bekleAcik", { s: saat(d.plan) })) + "</p></div></div>" : "") +
      noktaDetayHTML(id);
    // Adım 1: noktanın fotoğrafı (varış) · Adım 2: ödülle takım fotoğrafı (görev tamamlandı)
    const foto1 = kucukler[id] ? '<img class="foto-kucuk" data-foto="' + esc(id) + '" src="' + kucukler[id] + '" alt="">' : "";
    h += '<div class="adim' + (a.varis ? " bitti" : "") + '"><div class="adim-no">1</div><div class="adim-ic"><h4 class="adim-baslik">' + esc(t("adim1Baslik")) + "</h4>";
    if (a.varis) {
      h += '<div class="foto-satir">' + foto1 + "<div><b>✓ " + esc(t("varis", { s: saat(a.varis) })) + "</b>" +
        (a.mesafe != null ? '<small class="soluk">' + esc(t("uzak", { m: a.mesafe })) + "</small>" : "") +
        (lider() ? '<label class="metin-btn"><span class="et">' + esc(t("fotoDegistir")) + '</span><input type="file" accept="image/*" class="foto-input" data-tur="nokta" data-id="' + esc(id) + '"></label>' : "") + "</div></div>";
    } else if (lider()) {
      h += '<p class="soluk">' + esc(t("adimFoto")) + "</p>" +
        '<label class="btn ana foto-btn">' + etiketli("foto", t("fotoCek")) + '<input type="file" accept="image/*" class="foto-input" data-tur="nokta" data-id="' + esc(id) + '"></label>';
    } else h += '<p class="soluk">' + esc(t("liderFotoBekle")) + "</p>";
    h += '</div></div><div class="adim' + (a.varis ? "" : " kilitli") + '"><div class="adim-no">2</div><div class="adim-ic"><h4 class="adim-baslik">' + esc(t("adim2Baslik")) + "</h4>";
    if (lider()) {
      h += '<p class="soluk">' + esc(t(a.varis ? "adim2Acik" : "tamamlaOnce")) + "</p>" +
        '<label class="onay"><input type="checkbox" id="artefaktAldik" checked' + (a.varis ? "" : " disabled") + "> " + esc(t("artefaktAldik", { a: TL(n.artefakt) })) + "</label>" +
        (a.varis
          ? '<label class="btn yesil foto-btn">' + etiketli("foto", t("odulFoto")) + '<input type="file" accept="image/*" class="foto-input" data-tur="tamam" data-id="' + esc(id) + '"></label>' +
            '<button type="button" class="metin-btn" id="tamamBtn">' + esc(t("fotoYok")) + "</button>"
          : '<button type="button" class="btn yesil" disabled>' + etiketli("foto", t("odulFoto")) + "</button>");
    } else h += '<p class="soluk">' + esc(t("liderBitirecek")) + "</p>";
    h += "</div></div></div>";
  }

  const aktifHTML = h;
  h = hOnce;
  h += '<h2 class="bolum-baslik">' + esc(t("rota")) + '</h2><div class="nokta-listesi">';
  r.forEach((id, i) => {
    if (i === d.i && d.faz !== "final") { h += aktifHTML; return; }
    const n = VERI.istasyonlar[id], a = (durum.adimlar || {})[id] || {};
    const [pb, ps] = planDilim(durum.baslangic, i);
    const sinif = a.bitis ? "tamam" : i === d.i ? "aktif" : "sirada";
    let sag = "";
    const kt = kucukler[id + "_tamam"] || kucukler[id];
    if (a.bitis) sag = (kt ? '<img class="foto-mini" src="' + kt + '" alt="">' : "") + '<span class="saat-yesil">✓ ' + saat(a.bitis) + "</span>";
    else if (i === d.i) sag = '<span class="simdi">●</span>';
    else sag = '<span class="kilit-ikon" title="' + esc(t("kilitli", { n: i })) + '">' + ikon("kilit") + "</span>";
    h += '<div class="nokta-satir ' + sinif + '" data-id="' + esc(id) + '">' +
      '<button type="button" class="nokta-bas" aria-expanded="false"><span class="no">' + (a.bitis ? "✓" : i + 1) + "</span>" +
      '<span class="nokta-ikon">' + noktaIkon(id) + '</span><span class="nokta-ad">' + esc(TL(n.baslik)) + "<small>" + esc(TL(n.yer)) + " · " + esc(t("plan")) + " " + saat(pb) + "–" + saat(ps) + "</small></span>" +
      '<span class="nokta-sag">' + sag + "</span></button>" +
      '<div class="nokta-detay" hidden>' +
      (a.bitis ? '<p class="zamanlar">' + esc(t("varis", { s: saat(a.varis) })) + " · " + esc(t("tamamlandi", { s: saat(a.bitis) })) + "</p>" + fotoIkili(id) : "") +
      (!a.bitis && i > d.i ? '<p class="kilit-not">' + ikon("kilit") + " " + esc(t("kilitli", { n: i })) + "</p>" : "") +
      noktaDetayHTML(id) + "</div></div>";
  });
  h += "</div>";
  if (d.faz === "final") h += aktifHTML;

  h += bonusHTML();
  h += '<button type="button" class="btn ikincil kucuk" id="degistirBtn">' + esc(t(lider() ? "liderCikis" : "degistir")) + "</button>" + markaAlt();
  s.innerHTML = h;
  oyunBagla();
}

function bonusHTML() {
  let h = '<h2 class="bolum-baslik">' + esc(t("yolGorevleri")) + '</h2><p class="soluk">' + esc(t("yolGorevAcik")) + "</p>";
  for (const bid in VERI.yol_gorevleri) {
    const g = VERI.yol_gorevleri[bid];
    const ts = Object.keys((durum.bonus || {})[bid] || {}).sort();
    h += '<div class="kart bonus-kart"><h3>' + noktaIkon(bid) + " " + esc(TL(g.baslik)) + "</h3><p>" + esc(TL(g.aciklama)) + "</p>";
    // belirli bir yeri olan yol görevi (ör. Yukarıdan Bakış → Kuşbakışı Sultanahmet)
    if (isFinite(g.lat) && isFinite(g.lng)) {
      if (g.yer) h += '<p class="yer">' + ikon("konum") + " " + esc(TL(g.yer)) + "</p>";
      h += '<a class="btn harita" target="_blank" rel="noopener" href="' + haritaLink(g.lat, g.lng) + '">' + etiketli("konum", t("konumaGit")) + "</a>";
    }
    h += '<div class="artefakt-kutu kucuk">' + ikon("yildiz") + "<span>" + esc(TL(g.artefakt)) + "</span></div>";
    if (ts.length) {
      h += '<div class="foto-izgara">';
      ts.forEach((x) => {
        const k = "b_" + bid + "_" + x;
        h += kucukler[k] ? '<img class="foto-mini" data-foto="' + esc(k) + '" src="' + kucukler[k] + '" alt="">' : '<span class="foto-mini bos">📷</span>';
      });
      h += '</div><small class="soluk">' + esc(t("fotoSayisi", { n: ts.length })) + "</small>";
    }
    if (lider()) h += '<label class="btn ikincil foto-btn">' + etiketli("foto", t("fotoEkle")) + '<input type="file" accept="image/*" class="foto-input" data-tur="bonus" data-id="' + esc(bid) + '"></label>';
    h += "</div>";
  }
  return h;
}

function fotoBaslik(k) {
  const m = /^b_(.+)_\d+$/.exec(k);
  if (m) return TL((VERI.yol_gorevleri[m[1]] || {}).baslik);
  return noktaAdi(k.replace(/_tamam$/, "")) + (/_tamam$/.test(k) ? " · " + t("foto2") : "");
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
  const etiket = inp.parentElement, yazi = etiket.querySelector(".et") || etiket;
  const eski = yazi.textContent;
  etiket.classList.add("yukleniyor");
  yazi.textContent = t("fotoHazirlaniyor");
  let f;
  try { f = await fotoHazirla(dosya); }
  catch (e) {
    etiket.classList.remove("yukleniyor");
    yazi.textContent = eski;
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
  } else if (tur === "tamam") {
    const a = (durum.adimlar || {})[id];
    if (!a || !a.varis || a.bitis) return;
    a.bitis = ts;
    a.foto2 = ts;
    a.artefakt = $("artefaktAldik") ? $("artefaktAldik").checked : true;
    const k2 = id + "_tamam";
    kucukler[k2] = f.kucuk;
    kucukYaz();
    durumYaz();
    const p = { guncel: ts };
    p["adimlar/" + id + "/bitis"] = ts;
    p["adimlar/" + id + "/foto2"] = ts;
    p["adimlar/" + id + "/artefakt"] = a.artefakt;
    kuyrukEkle("PATCH", takimYolu(), p);
    kuyrukEkle("PUT", "kucuk/" + n + "/" + k2, f.kucuk);
    kuyrukEkle("PUT", "foto/" + n + "/" + k2, f.buyuk, true);
    gorulenBitis = bitisSayisi();
    ekranAc();
    aktifeKaydir(true);
    kutlamaGoster(id);
    return;
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
  if (!confirm(t("fotoYokOnay") + " · " + noktaAdi(id))) return;
  a.bitis = Date.now();
  a.artefakt = $("artefaktAldik").checked;
  durumYaz();
  const p = { guncel: a.bitis };
  p["adimlar/" + id + "/bitis"] = a.bitis;
  p["adimlar/" + id + "/artefakt"] = a.artefakt;
  kuyrukEkle("PATCH", takimYolu(), p);
  gorulenBitis = bitisSayisi();
  ekranAc();
  aktifeKaydir(true);
  kutlamaGoster(id);
}

function finaleVar() {
  if (!lider()) return;
  if (!confirm(t("finaleVardik") + "?")) return;
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
  let h = '<div class="final-hero">' + geriDugme() + '<div class="dil" id="dilKutu"></div>' + kemerSVG("orta") +
    '<p class="hero-ust">' + esc(t("bitti")) + '</p><h1 class="hero-baslik">' + esc(t("lanetKalkti")) + "</h1>" +
    '<p class="fh-takim">' + esc(t("takim")) + ' <span class="sayi">' + esc(durum.takim) + "</span>" + (durum.ad ? " · " + esc(durum.ad) : "") + "</p>" +
    '<div class="ozet-koyu"><div><small>' + esc(t("toplamSure")) + "</small><b>" + sureYaz(durum.final - durum.baslangic) + "</b></div>" +
    "<div><small>" + esc(t("artefaktlar")) + "</small><b>" + alinan.length + "/" + r.length + "</b></div>" +
    "<div><small>" + esc(t("puan")) + '</small><b id="bitisPuan">' + toplamPuan() + "</b></div></div></div>";
  h += koleksiyonHTML(true);
  h += '<div class="kart"><p>' + esc(TL(VERI.final)) + "</p>" + dinleBtn(TL(VERI.final)) + "</div>";
  const fotolar = [];
  r.forEach((id) => { if (kucukler[id + "_tamam"]) fotolar.push(id + "_tamam"); if (kucukler[id]) fotolar.push(id); });
  if (fotolar.length) {
    h += '<h2 class="bolum-baslik">' + esc(t("fotolarimiz")) + '</h2><div class="kolaj">' +
      fotolar.map((id) => '<img data-foto="' + esc(id) + '" src="' + kucukler[id] + '" alt="">').join("") + "</div>";
  }
  h += '<button type="button" class="btn ana" id="kartBtn">' + etiketli("paylas", t("kartKaydet")) + "</button>";
  h += bonusHTML();
  h += '<button type="button" class="btn ikincil kucuk" id="degistirBtn">' + esc(t(lider() ? "liderCikis" : "degistir")) + "</button>" + markaAlt();
  s.innerHTML = h;
  dilDugmeleri($("dilKutu"), yenidenCiz);
  fotoBagla(s);
  dinleBagla(s);
  $("kartBtn").onclick = hatiraKarti;
  $("degistirBtn").onclick = takimDegistir;
}

// ---------- Artefakt koleksiyonu ve kutlama ----------
function izleBantHTML() {
  return '<div class="izle-bant">' + ikon("goz") + " <span>" + esc(t("izleyiciBant")) + "</span>" +
    '<button type="button" class="bant-btn" data-lider-ol="1">' + esc(t("liderimBtn")) + "</button>" +
    '<form class="bant-form" hidden><input maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + esc(t("kod")) + '" aria-label="' + esc(t("kod")) + '"><button type="submit" class="bant-btn">OK</button><span class="bant-hata" role="alert"></span></form></div>';
}
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest("[data-lider-ol]");
  if (!b) return;
  const f = b.parentElement.querySelector(".bant-form");
  f.hidden = false; b.hidden = true; f.querySelector("input").focus();
  f.onsubmit = async (ev) => {
    ev.preventDefault();
    const n = durum.takim, hata = f.querySelector(".bant-hata");
    let ok = false;
    try { ok = await liderDogrula(n, f.querySelector("input").value); } catch (e2) { hata.textContent = t("girisHata"); return; }
    if (!ok) { hata.textContent = t("kodHata"); return; }
    durum = {};
    await liderGiris(n);
  };
});
function markaAlt() {
  return '<div class="marka-alt"><span>' + esc(t("organizator")) + '</span><span class="rozet-logo"><img src="medya/logo-mini.webp" alt="Invibe Global" width="64" height="60"></span>' +
    '<small class="surum">v ' + UYGULAMA_SURUM + "</small></div>";
}
function koleksiyonHTML(acik) {
  if (!durum.baslangic) return "";
  const r = rota(), adet = r.filter(artefaktVar).length;
  let h = '<div class="koleksiyon"><div class="kol-ust"><span>' + ikon("yildiz") + " " + esc(t("artefaktlar")) + "</span><b>" + adet + " / " + r.length + '</b></div><div class="kol-slotlar">';
  r.forEach((id) => {
    const n = VERI.istasyonlar[id], var_ = artefaktVar(id);
    h += '<span class="slot' + (var_ ? " dolu" : "") + '" title="' + esc(TL(n.artefakt)) + '">' + noktaIkon(id) + "</span>";
  });
  h += "</div><details" + (acik ? " open" : "") + "><summary>" + esc(t("kolListe")) + "</summary><ul>" +
    r.map((id) => { const n = VERI.istasyonlar[id], v = artefaktVar(id); return '<li class="' + (v ? "var" : "yok") + '">' + noktaIkon(id) + "<span>" + esc(TL(n.artefakt)) + " <small>· " + esc(TL(n.baslik)) + "</small></span></li>"; }).join("") +
    "</ul></details></div>";
  return h;
}
function bitisSayisi() {
  let k = 0;
  for (const id in durum.adimlar || {}) if (durum.adimlar[id].bitis) k++;
  return k;
}
let gorulenBitis = null;
// Görev tamamlanınca altın "artefakt kazanıldı" ekranı
function kutlamaGoster(id) {
  const n = VERI.istasyonlar[id];
  if (!n) return;
  const a = (durum.adimlar || {})[id] || {};
  const art = artefaktVar(id) || a.artefakt;
  const r = rota(), adet = r.filter(artefaktVar).length;
  const eski = $("kutlama");
  if (eski) eski.remove();
  const k = document.createElement("div");
  k.id = "kutlama";
  k.className = "kutlama";
  k.setAttribute("role", "dialog");
  k.setAttribute("aria-modal", "true");
  k.innerHTML = '<div class="kut-ic"><div class="kut-isik"></div><div class="kut-ikon">' + noktaIkon(id, "buyuk") + "</div>" +
    '<p class="kut-ust">' + esc(t(art ? "kutArtefakt" : "kutGorev")) + "</p><h2>" + esc(art ? TL(n.artefakt) : TL(n.baslik)) + "</h2>" +
    '<p class="kut-alt">' + esc(t("kutAlt", { x: TL(n.baslik), n: adet, m: r.length })) + "</p>" +
    '<button type="button" class="btn ana">' + esc(t("kutDevam")) + "</button></div>";
  document.body.appendChild(k);
  const kapat = () => { k.classList.add("kapaniyor"); setTimeout(() => { k.remove(); aktifeKaydir(true); }, 250); };
  k.querySelector("button").onclick = kapat;
  k.querySelector("button").focus();
  if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
}

// ---------- Hatıra kartı (paylaşılabilir görsel) ----------
function resimYukle(src) {
  return new Promise((ok, hata) => { const i = new Image(); i.onload = () => ok(i); i.onerror = hata; i.src = src; });
}
async function hatiraKarti() {
  const btn = $("kartBtn"), yazi = btn.querySelector(".et");
  const eski = yazi.textContent;
  yazi.textContent = t("kartHazirlaniyor");
  btn.disabled = true;
  try {
    await Promise.all([document.fonts.load('600 80px "Cormorant Garamond"'), document.fonts.load('800 40px "Nunito"')]).catch(() => {});
    const W = 1080, H = 1350, c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(W * 0.8, 120, 50, W * 0.6, 300, 1100);
    g.addColorStop(0, "#3e2a50"); g.addColorStop(1, "#16121f");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // kemerler
    x.strokeStyle = "rgba(201,163,90,.55)"; x.lineWidth = 3;
    [250, 215, 180].forEach((rr) => { x.beginPath(); x.moveTo(W / 2 - rr, 760); x.lineTo(W / 2 - rr, 420); x.arc(W / 2, 420, rr, Math.PI, 0); x.lineTo(W / 2 + rr, 760); x.stroke(); });
    x.textAlign = "center";
    x.fillStyle = "#c9a35a"; x.font = '800 30px "Nunito", sans-serif';
    x.fillText(TL(VERI.etkinlik.ad).toUpperCase(), W / 2, 110);
    x.fillStyle = "#f3ebdf"; x.font = '600 104px "Cormorant Garamond", serif';
    const baslik = t("lanetKalkti"), sat = baslik.length > 16 ? baslik.split(" ") : [baslik];
    if (sat.length > 1) { const yari = Math.ceil(sat.length / 2); x.fillText(sat.slice(0, yari).join(" "), W / 2, 230); x.fillText(sat.slice(yari).join(" "), W / 2, 330); }
    else x.fillText(baslik, W / 2, 280);
    x.font = '800 44px "Nunito", sans-serif';
    x.fillText(t("takim") + " " + durum.takim + (durum.ad ? " · " + durum.ad : ""), W / 2, 420);
    // fotoğraf kolajı
    const fotolar = rota().map((id) => (kucukler[id + "_tamam"] ? id + "_tamam" : kucukler[id] ? id : null)).filter(Boolean).slice(0, 6);
    const kx = 150, ky = 470, ks = 260, kg = 10;
    for (let i = 0; i < fotolar.length; i++) {
      try {
        const im = await resimYukle(kucukler[fotolar[i]]);
        const sx = kx + (i % 3) * (ks + kg), sy = ky + Math.floor(i / 3) * (ks + kg);
        const o = Math.min(im.width, im.height);
        x.drawImage(im, (im.width - o) / 2, (im.height - o) / 2, o, o, sx, sy, ks, ks);
      } catch (e) {}
    }
    // özet
    const r = rota(), alinan = r.filter(artefaktVar).length, oy = fotolar.length > 3 ? 1060 : fotolar.length ? 790 : 560;
    const kutu = (et, de, cx) => { x.fillStyle = "#b9aec4"; x.font = '700 28px "Nunito", sans-serif'; x.fillText(et, cx, oy); x.fillStyle = "#c9a35a"; x.font = '800 58px "Nunito", sans-serif'; x.fillText(de, cx, oy + 66); };
    kutu(t("toplamSure"), sureYaz(durum.final - durum.baslangic), W / 2 - 330);
    kutu(t("artefaktlar"), alinan + "/" + r.length, W / 2);
    kutu(t("puan"), String(toplamPuan()), W / 2 + 330);
    try { const logo = await resimYukle("medya/logo-kucuk.png"); const lw = 150, lh = logo.height * lw / logo.width; x.drawImage(logo, W / 2 - lw / 2, H - lh - 50, lw, lh); } catch (e) {}
    const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.9));
    const ad = "1001-" + t("takim").toLowerCase() + "-" + durum.takim + ".jpg";
    const dosya = new File([blob], ad, { type: "image/jpeg" });
    if (navigator.canShare && navigator.canShare({ files: [dosya] })) {
      try { await navigator.share({ files: [dosya], title: TL(VERI.etkinlik.ad) }); } catch (e) {}
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = ad;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
  } finally {
    yazi.textContent = eski;
    btn.disabled = false;
  }
}

// ---------- Ekran açık kalsın, süre dolunca uyar ----------
let ekranKilidi = null, sesBaglam = null;
async function ekranAcikTut() {
  const gerek = lider() && durum.baslangic && !durum.final && !document.hidden;
  try {
    if (gerek && !ekranKilidi && navigator.wakeLock) {
      ekranKilidi = await navigator.wakeLock.request("screen");
      ekranKilidi.addEventListener("release", () => { ekranKilidi = null; });
    } else if (!gerek && ekranKilidi) { await ekranKilidi.release(); ekranKilidi = null; }
  } catch (e) { ekranKilidi = null; }
}
// iPhone titreşimi desteklemediği için kısa bir ses de çalınır (ilk dokunuşta açılır)
function sesAc() {
  try { if (!sesBaglam) sesBaglam = new (window.AudioContext || window.webkitAudioContext)(); if (sesBaglam.state === "suspended") sesBaglam.resume(); } catch (e) {}
}
document.addEventListener("pointerdown", sesAc, { once: true });
function bip() {
  if (!sesBaglam) return;
  try {
    const z = sesBaglam.currentTime;
    [0, 0.35, 0.7].forEach((g) => {
      const o = sesBaglam.createOscillator(), v = sesBaglam.createGain();
      o.frequency.value = 880; o.connect(v); v.connect(sesBaglam.destination);
      v.gain.setValueAtTime(0.0001, z + g); v.gain.exponentialRampToValueAtTime(0.3, z + g + 0.02); v.gain.exponentialRampToValueAtTime(0.0001, z + g + 0.25);
      o.start(z + g); o.stop(z + g + 0.27);
    });
  } catch (e) {}
}
function yolaCikUyar() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  bip();
  let u = $("sureUyari");
  if (!u) { u = document.createElement("div"); u.id = "sureUyari"; u.className = "sure-uyari"; u.setAttribute("role", "alert"); document.body.appendChild(u); }
  u.innerHTML = ikon("ok") + "<span>" + esc(t("yolaCik")) + "</span>";
  u.classList.add("acik");
  u.onclick = () => u.classList.remove("acik");
  setTimeout(() => u.classList.remove("acik"), 8000);
}
function sureDolduUyar() {
  if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
  bip();
  if (!lider()) return;
  let u = $("sureUyari");
  if (!u) { u = document.createElement("div"); u.id = "sureUyari"; u.className = "sure-uyari"; u.setAttribute("role", "alert"); document.body.appendChild(u); }
  u.innerHTML = ikon("saat") + "<span>" + esc(t("sureDolduUyari")) + "</span>";
  u.classList.add("acik");
  u.onclick = () => u.classList.remove("acik");
  setTimeout(() => u.classList.remove("acik"), 8000);
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
  const etiket = d.faz === "yol" ? t("fazYol") : d.faz === "gorev" ? t("fazGorev") : d.faz === "bekle" ? t("fazBekle") : t("fazFinal");
  const metin = sureYaz(d.kalan);
  faz.textContent = d.faz === "bekle" ? etiket : etiket + " · " + noktaDk() + " " + t("dk");
  sayac.textContent = metin;
  const sinif = d.kalan < 0 ? "gec" : d.kalan < 120000 ? "az" : "";
  sayac.className = sinif;
  const kf = $("kartFaz"), ks = $("kartSayac");
  if (kf) kf.textContent = etiket;
  if (ks) { ks.textContent = d.kalan < 0 ? metin + " " + t("gecikme") : metin; ks.className = "kart-sayac " + sinif; }
  // süre dolduğu an titreşim
  const anahtar = d.faz + d.i;
  // bekleme bitti → "yola çıkın" uyarısı ve kartı yenile
  if (sonFaz === "bekle" + d.i && d.faz === "yol") { yolaCikUyar(); sonFaz = anahtar; if (!$("oyun").classList.contains("gizli")) yerindeCiz(); }
  if (d.kalan < 0 && sonFaz === anahtar + "+") { /* zaten bildirildi */ }
  else if (d.kalan < 0 && sonFaz === anahtar) { sureDolduUyar(); sonFaz = anahtar + "+"; }
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
  for (const id in durum.adimlar || {}) {
    if (durum.adimlar[id].foto || durum.adimlar[id].varis) k.push(id);
    if (durum.adimlar[id].foto2) k.push(id + "_tamam");
  }
  for (const b in durum.bonus || {}) for (const x in durum.bonus[b] || {}) k.push("b_" + b + "_" + x);
  return k;
}
// Aynı anda iki yenileme çalışmasın (ilk açılışta yarış durumu eski kutlamayı gösteriyordu)
let izleyiciMesgul = false;
async function izleyiciYenile() {
  if (izleyiciMesgul) return;
  izleyiciMesgul = true;
  try { await izleyiciYenileIc(); } finally { izleyiciMesgul = false; }
}
async function izleyiciYenileIc() {
  if (lider() || !durum.takim || !DB.var()) return;
  const n = durum.takim;
  let k;
  try { k = await DB.get("takimlar/" + n); } catch (e) { senkronGoster(); return; }
  if (durum.takim !== n || lider()) return;
  const ilkYukleme = !sonYenileme;
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
  if (durum.baslangic) {
    try {
      const yn = (await DB.get("yonetim/" + n)) || {};
      if (JSON.stringify(yn) !== JSON.stringify(yonetim)) { yonetim = yn; degisti = true; }
    } catch (e) {}
  }
  if (yoklamaSay++ % 4 === 0 && await konumAyarKontrol()) degisti = true;
  if (degisti) yerindeCiz(); else senkronGoster();
  // lider yeni bir görevi tamamladıysa izleyicilere de kutlama
  const b = bitisSayisi();
  if (!ilkYukleme && gorulenBitis !== null && b > gorulenBitis && !document.hidden) {
    const son = rota().filter((id) => (durum.adimlar[id] || {}).bitis).sort((p, q) => durum.adimlar[q].bitis - durum.adimlar[p].bitis)[0];
    if (son) kutlamaGoster(son);
  }
  gorulenBitis = b;
}

async function yokla() {
  if (!DB.var() || !durum.takim || !durum.baslangic || !lider()) return;
  try {
    const n = durum.takim;
    const [ot, yn, kn, dz] = await Promise.all([DB.get("takimlar/" + n + "/oturum"), DB.get("yonetim/" + n), DB.get("ayarlar/konumlar"), DB.get("takimlar/" + n + "/duzeltme")]);
    if (dz && dz > (durum.duzeltme || 0) && kuyruk.length === 0 && !isleniyor) {
      const k = await DB.get("takimlar/" + n);
      if (k) { await sunucudanAl(n, k); return; }
    }
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
    if (eski !== JSON.stringify(yonetim)) yerindeCiz();
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
  window.konumlarDegisti = () => { if (!$("oyun").classList.contains("gizli")) yerindeCiz(); };
  if (durum.takim && (!VERI.rotalar[durum.takim] || !durum.rol)) durum = {};
  // Güvenli moda geçmeden önce lider olmuş telefon: oturumu yoksa izlemeye geçer, ilerlemesi saklanır;
  // "Liderim" ile kodu girince kaldığı yerden devam eder
  if (lider() && !liderOturumuVar(durum.takim)) {
    yaz(A_YEDEK, { durum, kucukler });
    durum = { takim: durum.takim, rol: "izleyici" };
    kucukler = {};
    durumYaz(); kucukYaz();
  }
  // Lider linki: ?t=3&k=KOD  ·  Takım izleme linki: ?t=3
  const q = new URLSearchParams(location.search);
  const qn = q.get("t"), qk = q.get("k");
  if (qn) history.replaceState(null, "", location.pathname);
  if (qn && VERI.rotalar[qn]) {
    let dogru = false;
    if (qk) { try { dogru = await liderDogrula(qn, qk); } catch (e) { dogru = durum.takim === qn && lider(); } }
    if (qk && dogru) { await liderGiris(qn); }
    else if (qk) { alert(t("linkHata")); durum = {}; ekranAc(); }
    else if (durum.takim !== qn) izleyiciSec(qn);
    else ekranAc();
  } else ekranAc();
  swKaydet();
  if (durum.baslangic) setTimeout(() => aktifeKaydir(false), 50);
  gorulenBitis = bitisSayisi();
  konumBaslat();
  kuyrukIsle();
  yenile();
  yoklamaZ = setInterval(yenile, 15000);
  ekranAcikTut();
  setInterval(ekranAcikTut, 30000);
  document.addEventListener("visibilitychange", () => {
    ekranAcikTut();
    if (!document.hidden) { tik(); kuyrukIsle(); yenile(); }
  });
})();
