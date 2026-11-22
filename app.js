const $ = (id) => document.getElementById(id);
let durum = durumOku();
let zamanlayici = null;
let bekleyenFoto = null;      // seçilen fotoğrafın data URL'i

function rota() { return VERI.rotalar[durum.takim] || []; }
function bolumGoster(ad) {
  ["secim", "hazir", "oyun", "bitis"].forEach((b) => $(b).classList.toggle("gizli", b !== ad));
  $("ust").classList.toggle("gizli", ad === "secim");
}

function takimSecimiCiz() {
  const kutu = $("takimlar");
  kutu.innerHTML = "";
  Object.keys(VERI.rotalar).forEach((n) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = "Takım " + n;
    b.onclick = () => takimSec(n);
    kutu.appendChild(b);
  });
}
function takimSec(n) {
  durum = { takim: n, baslangic: null, tamamlanan: [] };
  durumYaz(durum);
  ekranAc();
}
function takimDegistir() {
  if (!confirm("Takımı değiştirirseniz bu telefondaki ilerleme silinir. Emin misiniz?")) return;
  clearInterval(zamanlayici);
  durumSil();
  durum = {};
  ekranAc();
}
function baslat() {
  durum.baslangic = Date.now();
  durumYaz(durum);
  senkronGonder(durum);
  ekranAc();
}

function ekranAc() {
  clearInterval(zamanlayici);
  bekleyenFoto = null;
  if (!durum.takim) { bolumGoster("secim"); return; }
  $("takimAd").textContent = "Takım " + durum.takim;
  if (!durum.baslangic) {
    $("hazirTakim").textContent = "Takım " + durum.takim;
    $("hazirNokta").textContent = VERI.etkinlik.baslangic_bitis_noktasi;
    $("hazirSure").textContent = VERI.etkinlik.sure_dakika;
    $("sayac").textContent = bicim(sureSaniye());
    bolumGoster("hazir");
    return;
  }
  zamanlayici = setInterval(sayacGuncelle, 1000);
  sayacGuncelle();
  if (durum.tamamlanan.length >= rota().length) { bitisGoster(); return; }
  listeCiz();
  bolumGoster("oyun");
}

function hedefMetni(i) {
  const tur = VERI.etkinlik.tur_dakika;
  if (!tur) return "";
  const bitis = durum.baslangic + (i + 1) * tur * 60000;
  const sa = new Date(bitis).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return '<div class="soluk" id="hedef">Tur ' + (i + 1) + "/" + rota().length +
    " · en geç <b>" + sa + "</b>'da bu noktadan ayrılın (en fazla " +
    (VERI.etkinlik.istasyon_max_dakika || 10) + " dk)</div>";
}

function sayacGuncelle() {
  const k = kalanSaniye(durum);
  $("sayac").textContent = bicim(k);
  $("ust").classList.toggle("az", k <= 600);
  const bitti = k === 0;
  $("sureDoldu").classList.toggle("gizli", !bitti);
  ["kodGiris", "kodDugme", "fotoDugme", "devamDugme"].forEach((id) => { if ($(id)) $(id).disabled = bitti; });
  const tam = durum.tamamlanan.length, tur = VERI.etkinlik.tur_dakika;
  if (tur && $("gec") && tam < rota().length) {
    $("gec").classList.toggle("gizli", Date.now() <= durum.baslangic + (tam + 1) * tur * 60000);
  }
}

function listeCiz() {
  const r = rota(), tam = durum.tamamlanan.length;
  const kutu = $("liste");
  kutu.innerHTML = "";
  $("ilerleme").textContent = tam + " / " + r.length + " nokta tamamlandı";
  r.forEach((id, i) => {
    const ist = VERI.istasyonlar[id];
    const div = document.createElement("div");
    const sinif = i < tam ? "tamam" : i === tam ? "aktif" : "kilitli";
    div.className = "kart istasyon " + sinif;
    let ic = '<div class="no">' + (i < tam ? "✓" : i + 1) + "</div><div style='flex:1;min-width:0'>";
    ic += "<h2>" + ist.ad + "</h2>";
    const konum = guvenliUrl(ist.konum);
    if (i === tam) {
      ic += "<p>" + ist.gorev + "</p>";
      if (konum) ic += '<a class="btn konum" href="' + konum + '" target="_blank" rel="noopener">📍 Konuma git</a>';
      ic += hedefMetni(i) + '<div id="gec" class="hata gizli">⚠ Hedef saat geçti. Görevi bitirip hemen sonraki noktaya geçin.</div>';
      if (ist.tip === "foto") {
        ic += '<label class="btn konum" id="fotoEtiket" style="margin-top:12px">📷 Fotoğraf çek / seç' +
          '<input id="fotoGiris" type="file" accept="image/*" capture="environment" hidden></label>' +
          '<img id="onizleme" class="onizleme gizli" alt="Seçilen fotoğraf">' +
          '<div id="hata" class="hata"></div>' +
          '<button id="fotoDugme" class="btn" disabled>Fotoğrafı Gönder</button>';
      } else if (ist.tip === "serbest") {
        ic += '<div id="hata" class="hata"></div><button id="devamDugme" class="btn">Tamam, devam et</button>';
      } else {
        const etiket = ist.tip === "sifre" ? "Bulduğunuz şifre kelimeyi yazın:" : "Görevi bitirince yetkilinin verdiği şifreyi yazın:";
        ic += '<p class="soluk" style="margin:14px 0 0">' + etiket + "</p>" +
          '<input id="kodGiris" type="text" placeholder="ŞİFRE" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false">' +
          '<div id="hata" class="hata"></div>' +
          '<button id="kodDugme" class="btn">Şifreyi Gönder</button>';
      }
    } else if (i < tam) {
      ic += '<div style="color:var(--yesil);font-weight:700">✅ Görev tamamlandı</div>';
    } else {
      ic += '<div class="soluk">🔒 Önceki noktayı bitirince açılır</div>';
    }
    div.innerHTML = ic + "</div>";
    kutu.appendChild(div);
  });
  const giris = $("kodGiris");
  if (giris) {
    $("kodDugme").onclick = kodDene;
    giris.addEventListener("keydown", (e) => { if (e.key === "Enter") kodDene(); });
  }
  if ($("devamDugme")) $("devamDugme").onclick = () => tamamla();
  if ($("fotoGiris")) {
    $("fotoGiris").onchange = fotoSecildi;
    $("fotoDugme").onclick = fotoGonder;
  }
  sayacGuncelle();
}

function tamamla(ekstra) {
  const id = rota()[durum.tamamlanan.length];
  durum.tamamlanan.push(Object.assign({ id, ts: Date.now() }, ekstra || {}));
  durumYaz(durum);
  senkronGonder(durum);
  ekranAc();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function kodDene() {
  if (kalanSaniye(durum) === 0) return;
  const id = rota()[durum.tamamlanan.length];
  const girilen = normalize($("kodGiris").value);
  if (!girilen) { $("hata").textContent = "Lütfen şifreyi yazın."; return; }
  if (girilen !== normalize(VERI.istasyonlar[id].kod)) {
    $("hata").textContent = "❌ Yanlış şifre! Tekrar deneyin veya yetkiliye sorun.";
    const g = $("kodGiris");
    g.classList.remove("sarsil"); void g.offsetWidth; g.classList.add("sarsil");
    if (navigator.vibrate) navigator.vibrate(200);
    g.select();
    return;
  }
  tamamla();
}

async function fotoSecildi(e) {
  const f = e.target.files[0];
  if (!f) return;
  $("hata").textContent = "";
  try {
    bekleyenFoto = await fotoKucult(f);
    $("onizleme").src = bekleyenFoto;
    $("onizleme").classList.remove("gizli");
    $("fotoDugme").disabled = kalanSaniye(durum) === 0;
  } catch (err) {
    bekleyenFoto = null;
    $("hata").textContent = "❌ Fotoğraf okunamadı, tekrar deneyin.";
  }
}
async function fotoGonder() {
  if (!bekleyenFoto || kalanSaniye(durum) === 0) return;
  const id = rota()[durum.tamamlanan.length];
  const btn = $("fotoDugme");
  btn.disabled = true; btn.textContent = "Gönderiliyor…";
  let yuklendi = false;
  if (senkronUrl()) {
    yuklendi = await uzakYaz("/fotolar/" + durum.takim + "/" + id, { foto: bekleyenFoto, ts: Date.now() });
    if (!yuklendi) {
      $("hata").textContent = "❌ Yüklenemedi. İnterneti kontrol edip tekrar deneyin.";
      btn.disabled = false; btn.textContent = "Fotoğrafı Gönder";
      return;
    }
  }
  try { localStorage.setItem(yerelFotoAnahtar(durum.takim, id), bekleyenFoto); } catch (e) {}
  tamamla({ foto: true, yuklendi });
}

function bitisGoster() {
  const gecen = Math.floor((durum.tamamlanan.at(-1).ts - durum.baslangic) / 1000);
  $("bitisSure").textContent = bicim(gecen) + " (dk:sn)";
  $("bitisNokta").textContent = VERI.etkinlik.baslangic_bitis_noktasi;
  const bk = guvenliUrl(VERI.etkinlik.baslangic_bitis_konum), bl = $("bitisKonum");
  bl.classList.toggle("gizli", !bk);
  if (bk) bl.href = bk;
  clearInterval(zamanlayici);
  $("sayac").textContent = bicim(Math.max(0, sureSaniye() - gecen));
  bolumGoster("bitis");
}

(async function () {
  try { await veriYukle(); }
  catch (e) {
    document.querySelector("main").innerHTML =
      '<div class="kart"><h2>Veri yüklenemedi</h2><p>data.json okunamadı. Siteyi dosyaya çift tıklayarak değil, bir sunucu (veya GitHub Pages) üzerinden açın.</p></div>';
    return;
  }
  document.title = VERI.etkinlik.ad;
  $("etkinlikAd").textContent = VERI.etkinlik.ad;
  $("nokta").textContent = VERI.etkinlik.baslangic_bitis_noktasi;
  if (durum.takim && !VERI.rotalar[durum.takim]) durum = {};
  takimSecimiCiz();
  $("baslat").onclick = baslat;
  document.querySelectorAll(".degistir").forEach((b) => (b.onclick = takimDegistir));
  ekranAc();
})();
