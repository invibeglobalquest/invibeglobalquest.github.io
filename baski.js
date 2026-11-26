// Baskı paketi: data.json + materyal.json'dan yazdırılabilir A4 sayfalar üretir
"use strict";
GUVEN.anahtar = "kv_oturum_y";

let M = null, SITE = "";
const FOTO = { gulhane: null, yolfoto: null };
const E = esc;
// Dil modu: "iki" = Rusça + Türkçe (organizatör için), "ru" = yalnızca Rusça (oyunculara basılacak set).
// Türkçe yalnızca oyunun kendisi olduğu yerde kalır: tekerlemeler, atasözlerinin aslı, baharatçıya söylenecek adlar.
let RU = false;
function ik(ru, tr, ayrac) { return RU ? ru : ru + (ayrac === undefined ? " · " : ayrac) + tr; }
function trY(html) { return RU ? "" : html; }
function ruKisim(s) { return RU ? String(s).split(" · ")[0] : s; }
// Zarf düzeninde her sayfanın altında hangi zarfa ait olduğu yazar
let ZARF = null;
function zarfIle(z, f) { ZARF = z; try { return f(); } finally { ZARF = null; } }
function ikiSutun(ru, tr) { return RU ? '<div class="gk-iki tek"><div>' + ru + "</div></div>" : '<div class="gk-iki"><div>' + ru + "</div><div>" + tr + "</div></div>"; }

function qr(metin) {
  if (typeof qrcode !== "function") return "";
  const q = qrcode(0, "M");
  q.addData(metin);
  q.make();
  return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}
function parcala(dizi, n) {
  const c = [];
  for (let i = 0; i < dizi.length; i += n) c.push(dizi.slice(i, i + n));
  return c;
}
function istIdleri() { return Object.keys(VERI.istasyonlar); }
function ist(id) { return VERI.istasyonlar[id]; }
function renk(n) { return M.renkler[(parseInt(n, 10) - 1) % M.renkler.length]; }
function dk(m) { return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); }
// i. noktaya beklenen varış (başlangıçtan dakika)
function beklenen(i) { return i * noktaDk(); }
function telefon() { try { return localStorage.getItem("kv_baski_tel") || ""; } catch (e) { return ""; } }

function sayfa(ic, etiket) {
  return '<section class="sayfa">' + ic + '<div class="alt-not"><span>' + E(VERI.etkinlik.ad.ru) + trY(" · " + E(VERI.etkinlik.ad.tr)) +
    "</span><span>" + (ZARF ? "✉ " + E(ik(ZARF.ru, ZARF.tr)) : trY(E(etiket || ""))) + "</span></div></section>";
}
function yarimlar(parcalar, etiket) {
  return parcala(parcalar, 2).map((p) => sayfa('<div class="iki-yarim"><div>' + p[0] + "</div><div>" + (p[1] || "") + "</div></div>", etiket));
}
function izgara(kartlar, sinif, adet, etiket) {
  return parcala(kartlar, adet).map((p) => sayfa('<div class="izgara ' + sinif + '">' + p.map((k) => "<div>" + k + "</div>").join("") +
    "<div></div>".repeat(adet - p.length) + "</div>", etiket));
}
function yarimBaslik(ru, sag) { return '<div class="yarim-baslik"><h2>' + E(ru) + '</h2><div class="t">' + sag + "</div></div>"; }
function fotoAlan(tur, yukseklik) {
  const src = FOTO[tur];
  return '<div class="foto-alan" style="height:' + yukseklik + 'mm">' +
    (src ? '<img src="' + src + '" alt="">' : (RU ? "<div>Фото<br><small>(вклейте сюда распечатанную фотографию)</small></div>" : "<div>Фото · Fotoğraf<br><small>(baski.html sayfasında seçin ya da basılı fotoğrafı buraya yapıştırın)</small></div>")) + "</div>";
}

// ---------- Bölümler ----------
function afis() {
  const temiz = SITE.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return [sayfa('<div class="afis cerceve"><div><div class="ust-etiket">' + E(VERI.etkinlik.alt.ru) + "</div>" +
    "<h1>" + E(VERI.etkinlik.ad.ru) + "</h1>" + trY('<div class="alt">' + E(VERI.etkinlik.ad.tr) + "</div>") + "</div>" +
    '<div class="qr">' + qr(SITE) + '</div><div class="url">' + E(temiz) + "</div>" +
    "<div><ol><li>Наведите камеру телефона на QR-код или откройте ссылку.</li>" +
    "<li>Выберите свою команду — увидите маршрут, задания и таймер.</li>" +
    "<li>Точки отмечает только лидер команды по своей личной ссылке.</li></ol>" +
    trY('<div class="tr-blok">Telefon kamerasını QR koda tutun veya linki açın · Takımınızı seçin: rota, görevler ve sayaç · Noktaları yalnızca takım lideri işaretler.</div>') + "</div></div>",
  "Ortak link afişi")];
}

function zarflar() { return takimNolari().map(zarfKarti); }
function zarfKarti(n) {
  const tel = telefon();
  {
    const c = renk(n), r = VERI.rotalar[n], kod = (VERI.lider_kodlari || {})[n] || "";
    const lider = SITE + "?t=" + n + "&k=" + kod, izle = SITE + "?t=" + n;
    let rota = '<li class="uc"><span class="n">◆</span><span><b>Старт:</b> ' + E(VERI.baslangic.ad.ru) + "</span></li>";
    r.forEach((id, i) => {
      const s = ist(id);
      rota += '<li><span class="n">' + (i + 1) + "</span><span><b>" + E(s.baslik.ru) + "</b><small>" + E(s.yer.ru) +
        " · план +" + dk(beklenen(i)) + "–" + dk(beklenen(i + 1)) + "</small></span></li>";
    });
    rota += '<li class="uc"><span class="n">◆</span><span><b>Финал:</b> ' + E(VERI.baslangic.ad.ru) + "</span></li>";
    return sayfa('<div class="zarf-ust" style="background:' + c.hex + '"><div class="no">' + E(n) + "</div><div><h1>Команда <span class=\"sayi\">" + E(n) + "</span>" +
      "</h1><small>" + (RU ? E(c.ru) : "Takım " + E(n) + " · " + E(c.ru) + " / " + E(c.tr)) + "</small></div></div>" +
      '<div class="zarf-govde"><div class="lider-qr"><div class="ust-etiket">Личная ссылка лидера</div><div class="qr">' + qr(lider) + "</div>" +
      '<div class="kod">' + E(kod) + '</div><div class="tr">' + ik("Код лидера", "Lider kodu") + "</div>" +
      '<div class="uyari">Не передавайте эту ссылку никому: только лидер отмечает точки.</div></div>' +
      '<div><div class="ust-etiket">' + ik("Ваш маршрут", "Rotanız") + '</div><ol class="rota-l">' + rota + "</ol></div></div>" +
      '<div class="zarf-alt"><div><div class="ust-etiket">Правила</div><ul>' +
      "<li>На каждую точку — " + noktaDk() + " минут: дорога и задание вместе.</li>" +
      "<li>На точке лидер загружает фото точки — это отметка о прибытии.</li>" +
      "<li>После задания лидер загружает фото команды с наградой — точка завершена.</li>" +
      "<li>Задания в пути (бонус) можно выполнять в любой момент.</li></ul>" +
      '<div class="telefon">Телефон организатора: ' + (tel ? E(tel) : "______________________") + "</div></div>" +
      '<div class="uye-qr"><div class="qr">' + qr(izle) + "</div>Участникам команды: смотреть маршрут</div></div>",
    "Takım zarfı " + n);
  }
}

function yolfoto() { return yarimlar(takimNolari().map(yolfotoKart), "Yol görevi fotoğrafı"); }
function yolfotoKart(n) {
  const g = VERI.yol_gorevleri.iz;
  return '<div class="cerceve">' + yarimBaslik(g.baslik.ru, ik("Задание в пути", "Yol görevi") + "<br>Команда " + E(n)) +
    '<p style="font-size:10pt">Гевхерли любила свои тайные уголки города. Найдите место с этой фотографии и повторите снимок как можно точнее: та же точка, тот же ракурс. Лидер загружает фото в разделе «Задания в пути». Награда: фрагмент старинной карты и бонусные баллы.</p>' +
    fotoAlan("yolfoto", 78) +
    trY('<p class="tr" style="margin-top:2mm">Bu fotoğraftaki yeri bulun ve aynı açıdan yeniden çekin; lider «Yol görevleri»ne yükler. Ödül: eski harita parçası + bonus puan.</p>') + "</div>";
}

function metinSayfasi(baslik, trBaslik, ruEtiket, ru, tr, etiket) {
  const p = (s) => '<p class="' + (/^\(/.test(s) ? "sahne" : "") + '">' + E(s) + "</p>";
  return sayfa('<div class="metin"><div class="ust-etiket">' + E(RU ? ruEtiket : trBaslik) + "</div><h1>" + E(baslik) + '</h1><div class="ru">' +
    ru.map(p).join("") + "</div>" + trY('<div class="tr-b"><div class="ust-etiket">Türkçesi</div>' + tr.map(p).join("") + "</div>") + "</div>", etiket);
}
function sunucu() { return [metinSayfasi("Слово ведущего на старте", "Başlangıç sunucusu", "Ведущий · старт", M.sunucu.ru, M.sunucu.tr, "Sunucu metni")]; }
function final() { return [metinSayfasi("Финал: Гевхерли Ханым", "Final · Gevherli Hanım oyuncusu", "Финал · роль Гевхерли Ханым", M.final.ru, M.final.tr, "Final metni")]; }

function ozelBolum(id) {
  const satir = (et) => '<div style="display:flex;gap:3mm;align-items:end;margin-top:2mm"><span style="flex:none;font-size:9.5pt">' + et + '</span><div class="cizgi-alan" style="flex:1"></div></div>';
  switch (id) {
    case "dikilitas":
      return '<div class="cevap" style="margin-top:4mm"><b>' + ik("Ответ", "Cevap") + ":</b> " + E(M.sifre.mesaj) + trY(' <span class="tr">(«Ayna evine döndü»)</span>') + '<br><span class="tr">' + ik("Плакат «Послание обелиска» держите у ограды, не прикрепляйте к памятнику.", "Afişi parmaklığın yanında tutun, anıta yapıştırmayın.") + "</span></div>";
    case "canta":
      return "<h3>" + ik("Подсказки (заполните заранее)", "İpuçları") + "</h3>" + satir(ik("1 — общая характеристика", "genel özellik")) + satir(ik("2 — конкретная деталь", "belirgin detay")) + satir(ik("3 — почти прямое указание", "neredeyse doğrudan"));
    case "gulhane":
      return "<h3>" + ik("Отличия на фото (заполните заранее)", "Fotoğraftaki farklar") + "</h3>" + [1, 2, 3, 4, 5].map((i) => satir(i + ".")).join("") +
        '<p class="tr" style="margin-top:1.5mm">Пример: ' + E(M.gulhane_farklar.map(ruKisim).join(", ")) + "</p>";
    case "baharat":
      return '<div class="cevap" style="margin-top:4mm"><b>' + ik("Список", "Liste") + ":</b> " + M.baharatlar.map((b) => E(b.ru) + " " + b.g + " г").join(", ") + " = 30 г</div>";
    case "amfi": return '<p class="kutu-not" style="margin-top:4mm">' + ik("Карточки пословиц — отдельный набор (20 шт.): читайте начало, команда продолжает и объясняет смысл.", "Atasözü kartları ayrı bir takımdır.") + "</p>";
    case "simit": return '<p class="kutu-not" style="margin-top:4mm">' + ik("Карточки скороговорок — отдельный набор: каждый участник тянет карточку.", "Tekerleme kartları ayrı bir takımdır.") + "</p>";
    case "oyun": return '<p class="kutu-not" style="margin-top:4mm">' + ik("Карточки игр — отдельный набор; ответы к «Спичкам» на карточке игры.", "Oyun kartları ayrı bir takımdır; kibrit cevapları kartın üstünde.") + "</p>";
    default: return "";
  }
}
function gorevliler() { return istIdleri().reduce((a, id) => a.concat(gorevliSayfalari(id)), []); }
function gorevliSayfalari(id) {
  const sayfalar = [];
  {
    const s = ist(id), g = M.gorevli[id] || {};
    const li = (a) => a.map((x) => "<li>" + E(x) + "</li>").join("");
    sayfalar.push(sayfa('<div class="gk"><div class="gk-ust"><div><div class="ust-etiket">' + ik("Карточка ведущего", "Görevli kartı") + "</div><h1>" + E(s.baslik.ru) +
      "</h1>" + trY("<h2>" + E(s.baslik.tr) + "</h2>") + '<div class="yer">' + ik(E(s.yer.ru), E(s.yer.tr)) + "</div></div>" +
      '<div style="text-align:right;max-width:55mm"><div class="ust-etiket">Артефакт</div><b>' + E(s.artefakt.ru) + "</b>" + trY('<div class="tr">' + E(s.artefakt.tr) + "</div>") + "</div></div>" +
      '<h3>Легенда — прочитайте команде</h3><p class="efsane">' + E(s.hikaye.ru) + "</p>" +
      ikiSutun("<h3>Задание</h3><ul>" + li(s.gorev.ru) + "</ul>" + (s.kosul ? '<p class="kutu-not" style="margin-top:2mm">' + E(s.kosul.ru) + "</p>" : ""),
        '<h3>Görev</h3><ul class="tr-k">' + li(s.gorev.tr) + "</ul>" + (s.kosul ? '<p class="kutu-not tr-k" style="margin-top:2mm">' + E(s.kosul.tr) + "</p>" : "")) +
      (g.malzeme ? ikiSutun("<h3>Реквизит</h3><p>" + E(g.malzeme.ru) + "</p>", '<h3>Malzeme</h3><p class="tr-k">' + E(g.malzeme.tr) + "</p>") : "") +
      (g.puan ? ikiSutun("<h3>Баллы и артефакт</h3><p>" + E(g.puan.ru) + "</p>", '<h3>Puan ve artefakt</h3><p class="tr-k">' + E(g.puan.tr) + "</p>") : "") +
      ozelBolum(id) + "</div>", "Görevli kartı · " + s.baslik.tr));
    // puan çizelgesi: takımlar beklenen varış sırasıyla
    const sira = takimNolari().map((n) => ({ n, i: VERI.rotalar[n].indexOf(id) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i || a.n - b.n);
    const satirlar = sira.map((x) => '<tr><td><span class="renk" style="background:' + renk(x.n).hex + '"></span><b>' + E(x.n) + "</b> <span class=\"tr\">" + E(renk(x.n).ru) +
      "</span></td><td>≈ +" + dk(beklenen(x.i)) + "</td><td></td><td></td><td></td><td></td><td></td></tr>").join("");
    const th = (ru, tr) => "<th>" + ik(ru, tr, "<br>") + "</th>";
    sayfalar.push(sayfa('<div class="gk"><div class="gk-ust"><div><div class="ust-etiket">' + ik("Лист баллов", "Puan çizelgesi") + "</div><h1>" + E(s.baslik.ru) + "</h1>" + trY("<h2>" + E(s.baslik.tr) + "</h2>") +
      '</div><div style="font-size:10pt;padding-top:6mm">' + ik("Ведущий", "Görevli") + ": ____________________</div></div>" +
      '<p class="tr">' + ik("Команды приходят примерно в этом порядке; время — от общего старта.", "Takımlar yaklaşık bu sırayla gelir; süre ortak başlangıçtan itibaren.") + "</p>" +
      '<table class="cizelge"><thead><tr>' + th("Команда", "Takım") + th("Ожидается", "Beklenen") + th("Прибытие", "Varış") + th("Результат", "Sonuç") + th("Артефакт ✓", "Artefakt") + th("Баллы", "Puan") + th("Подпись", "İmza") + "</tr></thead><tbody>" +
      satirlar + '</tbody></table><p class="kutu-not" style="margin-top:4mm">' + ik("Сообщайте результат организатору сразу после каждой команды.", "Her takımdan sonra sonucu yöneticiye iletin.") + "</p></div>",
    "Puan çizelgesi · " + s.baslik.tr));
  }
  return sayfalar;
}

function tekerleme() {
  const kart = (k, i) => '<div class="tk' + (k.tr.length > 70 ? " uzun" : "") + '"><div class="ust-etiket">' + ik("Скороговорка", "Tekerleme") + " " + (i + 1) + "</div>" +
    '<div class="tr-metin"' + (k.tr.length > 70 ? ' style="font-size:10.5pt"' : "") + ">" + E(k.tr) + "</div>" +
    '<div class="kiril"' + (k.kiril.length > 70 ? ' style="font-size:9pt"' : "") + ">" + E(k.kiril) + '</div><div class="anlam">' + E(k.ru) + "</div></div>";
  const set = M.tekerlemeler.map(kart);
  return izgara(set, "i2x5", 10, "Tekerleme kartları (1/2)").concat(izgara(set, "i2x5", 10, "Tekerleme kartları (2/2)"));
}

function atasozu() {
  const kart = (a, i) => '<div class="as"><div class="no">' + (i + 1) + '</div><div class="ust-etiket">' + ik("Пословица", "Atasözü") + "</div>" +
    '<div class="bas">' + E(a.bas) + '</div><div class="devam"><b>Ответ:</b> ' + E(a.devam) + "</div>" +
    '<div class="orj">' + (RU ? "<b>По-турецки:</b> " : "") + E(a.tr) + '</div><div class="anlam"><b>Смысл:</b> ' + E(a.anlam) + "</div></div>";
  return izgara(M.atasozleri.map(kart), "i2x4", 8, "Atasözü kartları");
}

function oyun() {
  const kart = (o) => '<div class="oy"><div class="ust-etiket">' + ik("Игра хозяйки", "Hanımın Oyunu") + "</div><h2>" + E(o.ru.ad) + trY("<small>" + E(o.tr.ad) + "</small>") + "</h2>" +
    "<p>" + E(o.ru.kural) + "</p>" + trY('<p class="tr">' + E(o.tr.kural) + "</p>") + '<p class="mal">Реквизит: ' + E(ruKisim(o.malzeme)) + " · до 60 секунд</p>" +
    (o.ipucu ? '<p class="kutu-not">' + E(o.ipucu.ru) + "</p>" : "") +
    (o.bulmaca ? '<div class="kibrit">' + o.bulmaca.map((b) => '<span class="s">' + E(b.soru) + '</span><span>→ <b>' + E(b.cevap) + "</b></span>").join("") + "</div>" : "") + "</div>";
  return izgara(M.oyunlar.map(kart), "i2x3", 6, "Hanımın Oyunu kartları");
}

function sifre() { return yarimlar(takimNolari().map(sifreKart), "Şifre zarfı").concat([sifreAfisi()]); }
function sifreParca() {
  const harita = {};
  M.sifre.alfabe.forEach((x) => (harita[x[0]] = x[1]));
  const alfabe = '<div class="alfabe">' + M.sifre.alfabe.map((x) => '<div><span class="h">' + x[1] + '</span><span class="l">' + E(x[0]) + "</span></div>").join("") + "</div>";
  const kelimeler = M.sifre.mesaj.split(/\s+/);
  const kutular = '<div class="kutular">' + kelimeler.map((k) => '<div class="kelime">' + "<span></span>".repeat(Array.from(k).length) + "</div>").join("") + "</div>";
  return { harita, alfabe, kutular, kelimeler };
}
function sifreKart(n) {
  const { alfabe, kutular } = sifreParca();
  return '<div class="cerceve">' + yarimBaslik("Послание из прошлого", "Египетский обелиск<br>Команда " + E(n)) +
    '<p style="font-size:9.5pt">Перед смертью Гевхерли прошептала особую фразу, а доверенный человек зашифровал её древними символами. Найдите послание у обелиска и расшифруйте его по этому алфавиту. Фраза понадобится в финале.</p>' +
    alfabe + '<div class="ust-etiket">' + ik("Ваш ответ", "Cevabınız") + "</div>" + kutular +
    trY('<p class="tr" style="margin-top:2mm">Dikilitaştaki mesajı bu alfabeyle çözün; cümle finalde gerekecek.</p>') + "</div>";
}
function sifreAfisi() {
  const { harita, kelimeler } = sifreParca();
  return sayfa('<div class="mesaj-afis cerceve"><div class="ust-etiket">' + ik("Египетский обелиск", "Dikilitaş") + "</div><h1>Послание обелиска</h1>" +
    trY('<div class="tr">Dikilitaşın mesajı</div>') + '<div class="kelimeler">' +
    kelimeler.map((k) => "<div>" + Array.from(k).map((h) => harita[h] || h).join("") + "</div>").join("") + "</div>" +
    "<p>Расшифруйте послание с помощью алфавита из вашего конверта.</p>" + trY('<p class="tr">Zarfınızdaki alfabeyle mesajı çözün.</p>') + "</div>", "Dikilitaş mesajı (afiş)");
}

function baharat() { return yarimlar(takimNolari().map(baharatKart), "Baharat listesi"); }
function baharatKart(n) {
  const satirlar = M.baharatlar.map((b, i) => "<tr><td>" + (i + 1) + "</td><td><b>" + E(b.ru) + '</b></td><td class="tr">' + E(b.tr) + '</td><td class="g">' + b.g + ' г</td><td><span class="kare"></span></td></tr>').join("");
  // Türkçe adlar Rusça sette de kalır: oyuncular baharatçıya bu adları söyler
  return '<div class="cerceve">' + yarimBaslik("Последний рецепт Гевхерли", ik("Лавка специй", "Baharatçı") + "<br>Команда " + E(n)) +
    '<p style="font-size:9.5pt;margin-bottom:1mm">Отмерьте каждую специю на весах и смешайте в мешочке. Общий вес — <b>ровно 30 граммов</b>.</p>' +
    '<table class="liste-tablo sik"><thead><tr><th>№</th><th>Специя</th><th>' + (RU ? "По-турецки (для продавца)" : "Baharat") + '</th><th style="text-align:right">Вес</th><th>✓</th></tr></thead><tbody>' + satirlar +
    '<tr><td></td><td colspan="2"><b>' + ik("Итого", "Toplam") + "</b>" + trY(' <span class="tr">(her baharatı tartıp karıştırın; toplam tam 30 g)</span>') + '</td><td class="g">30 г</td><td></td></tr></tbody></table></div>';
}

function alisveris() { return yarimlar(takimNolari().map(alisverisKart), "Alışveriş listesi"); }
function alisverisKart(n) {
  const satirlar = M.alisveris.kalemler.map((k) => '<tr><td><span class="kare"></span></td><td><b>' + E(k.ru) + "</b>" + trY('<br><span class="tr">' + E(k.tr) + "</span>") +
    '</td><td class="yaz" style="width:46%"></td><td class="yaz" style="width:16%"></td></tr>').join("");
  return '<div class="cerceve">' + yarimBaslik("Торг с судьбой", ik("Базар Араста", "Arasta Çarşısı") + "<br>Команда " + E(n)) +
    '<p style="font-size:10pt">Купите пять предметов-символов. Бюджет команды: <b>' + E(M.alisveris.butce) + "</b>. Торговаться можно и нужно. Сохраните чеки и объясните ведущему, почему каждый предмет подходит.</p>" +
    '<table class="liste-tablo"><thead><tr><th>✓</th><th>' + ik("Категория", "Kategori") + "</th><th>" + ik("Что купили", "Ne aldınız") + "</th><th>Цена, TL</th></tr></thead><tbody>" + satirlar + "</tbody></table>" +
    '<p style="margin-top:3mm;font-weight:800">' + ik("Итого потрачено", "Toplam") + ": ____________ TL</p></div>";
}

function gulhane() { return yarimlar(takimNolari().map(gulhaneKart), "Gülhane fark kartı"); }
function gulhaneKart(n) {
  const s = ist("gulhane");
  return '<div class="cerceve">' + yarimBaslik(s.baslik.ru, ik("Парк Гюльхане", "Gülhane") + "<br>Команда " + E(n)) +
    '<p style="font-size:9.5pt">Найдите это место в парке. Время исказило воспоминание: на фото есть 5 деталей, которых в реальности нет. Обведите их на фото.</p>' +
    fotoAlan("gulhane", 80) +
    '<p style="margin-top:2mm;font-weight:800">' + ik("Найдено отличий", "Bulunan fark") + ": ____ / 5</p></div>";
}

// Kâğıt artefaktlar ve onları veren yer: büyü sözü → Dikilitaş, hatıra parçası → Gülhane,
// artefakt parçası → Amfitiyatro, eski harita parçası → yol görevi (fotoğraf) ödülü
const ARTEFAKTLAR = [
  { id: "buyu", s: "✦", ru: "Заклинание", tr: "Büyü sözü", satir: 2, alt: "Впишите расшифрованную фразу" },
  { id: "hatira", s: "❖", ru: "Фрагмент воспоминания", tr: "Hatıra parçası" },
  { id: "parca", s: "◈", ru: "Фрагмент артефакта", tr: "Artefakt parçası" },
  { id: "harita", s: "✧", ru: "Фрагмент старинной карты", tr: "Eski harita parçası" }
];
function artefakt() { return izgara(ARTEFAKTLAR.reduce((a, t) => a.concat(artefaktKartlari(t)), []), "i2x4", 8, "Kâğıt artefaktlar"); }
function artefaktSayfalari(id) { return izgara(artefaktKartlari(ARTEFAKTLAR.find((t) => t.id === id)), "i2x4", 8, "Kâğıt artefaktlar"); }
function artefaktKartlari(t) {
  const kartlar = [];
  {
    for (let i = 0; i < 12; i++) {
      kartlar.push('<div class="art"><div class="ic"><div class="sembol">' + t.s + '</div><div class="ust-etiket">' + ik("Артефакт", "Artefakt") + "</div><h3>" + E(t.ru) +
        "</h3>" + trY('<div class="tr">' + E(t.tr) + "</div>") + (t.satir ? '<div class="tr" style="margin-top:2mm">' + E(t.alt) + "</div>" + '<div class="satir"></div>'.repeat(t.satir) : "") + "</div></div>");
    }
  }
  return kartlar;
}

function mektup() { return yarimlar(takimNolari().map(mektupKart), "Gevherli'nin mektubu"); }
function mektupKart() {
  const m = M.mektup;
  return '<div class="cerceve"><div class="mektup"><div class="ust-etiket" style="text-align:center;margin-bottom:3mm">' + ik("Запечатанное письмо", "Mühürlü mektup") + "</div>" +
    '<div class="hitap">' + E(m.hitap) + "</div>" + m.paragraflar.map((p) => "<p>" + E(p) + "</p>").join("") + '<div class="imza">— ' + E(m.imza) + "</div></div></div>";
}

const BOLUMLER = [
  { id: "afis", ad: "Ortak link afişi", f: afis },
  { id: "zarf", ad: "Takım zarfı kartları", f: zarflar },
  { id: "yolfoto", ad: "Yol görevi fotoğrafı", f: yolfoto },
  { id: "sunucu", ad: "Başlangıç sunucusu metni", f: sunucu },
  { id: "gorevli", ad: "Görevli kartları + puan çizelgeleri", f: gorevliler },
  { id: "tekerleme", ad: "Tekerleme kartları (2 takım)", f: tekerleme },
  { id: "atasozu", ad: "Atasözü kartları", f: atasozu },
  { id: "oyun", ad: "Hanımın Oyunu kartları", f: oyun },
  { id: "sifre", ad: "Şifre zarfı + dikilitaş afişi", f: sifre },
  { id: "baharat", ad: "Baharat listesi", f: baharat },
  { id: "alisveris", ad: "Alışveriş listesi", f: alisveris },
  { id: "gulhane", ad: "Gülhane fark kartı", f: gulhane },
  { id: "artefakt", ad: "Kâğıt artefaktlar", f: artefakt },
  { id: "mektup", ad: "Gevherli'nin mektubu", f: mektup },
  { id: "final", ad: "Final metni", f: final }
];

// ---------- Zarf düzeni: her takıma bir zarf + yönetici zarfı ----------
function zarfEtiketi(n) {
  const c = renk(n);
  const sat = (ru, tr) => '<li><span class="kare"></span><span>' + ik(ru, tr) + "</span></li>";
  return '<div class="cerceve zarf-etiket"><div class="zarf-ust" style="background:' + c.hex + '"><div class="no">' + E(n) + "</div><div>" +
    '<div class="ze-ad">' + ik("Конверт команды", "Takım zarfı") + "</div><h1>Команда " + E(n) + trY(" · Takım " + E(n)) + "</h1><small>" + (RU ? E(c.ru) : E(c.ru) + " / " + E(c.tr)) + "</small></div></div>" +
    '<div class="ust-etiket" style="margin-top:5mm">' + ik("Содержимое конверта", "İçindekiler") + '</div><ul class="ze-liste">' +
    sat("Карточка команды: ссылка лидера, маршрут, правила", "Takım kartı: lider linki, rota, kurallar") +
    sat("Фото задания в пути", "Yol görevi fotoğrafı") +
    sat("Шифр-карточка (обелиск)", "Şifre kartı (Dikilitaş)") +
    sat("Список специй", "Baharat listesi") +
    sat("Список покупок (базар Араста)", "Alışveriş listesi (Arasta)") +
    sat("Карточка «Найдите отличия» (Гюльхане)", "Gülhane fark kartı") +
    '</ul><p class="tr" style="margin-top:3mm">' + ik("Конверт выдаётся лидеру команды на старте. Эту этикетку можно вырезать и наклеить на конверт.",
      "Zarf başlangıçta takım liderine verilir. Bu etiket kesilip zarfın üstüne yapıştırılabilir.") + "</p></div>";
}
function takimZarfi(n) {
  return yarimlar([zarfEtiketi(n), yolfotoKart(n), sifreKart(n), baharatKart(n), alisverisKart(n), gulhaneKart(n)], "").concat([zarfKarti(n)]);
}
// Yönetici zarfında her noktanın görevlisine verilecek ek kartlar
const NOKTA_EKLERI = {
  amfi: { f: () => atasozu().concat(artefaktSayfalari("parca")), ru: "карточки пословиц (" + "{a}" + "), фрагменты артефакта (12)", tr: "atasözü kartları ({a}), artefakt parçası (12)" },
  gulhane: { f: () => artefaktSayfalari("hatira"), ru: "фрагменты воспоминания (12)", tr: "hatıra parçası (12)" },
  simit: { f: () => tekerleme().concat(mektup()), ru: "карточки скороговорок (2 набора), запечатанные письма (10)", tr: "tekerleme kartları (2 takım), mühürlü mektup (10)" },
  dikilitas: { f: () => [sifreAfisi()].concat(artefaktSayfalari("buyu")), ru: "плакат «Послание обелиска», карточки «Заклинание» (12)", tr: "Dikilitaş mesaj afişi, büyü sözü kartı (12)" },
  oyun: { f: () => oyun(), ru: "карточки игр ({o})", tr: "Hanımın Oyunu kartları ({o})" }
};
function halkaSirasi() { return VERI.rotalar[takimNolari()[0]] || istIdleri(); }
function ekMetin(x) { return x.replace("{a}", M.atasozleri.length).replace("{o}", M.oyunlar.length); }
function yoneticiKapak() {
  // Organizatörün paketleme listesi: her iki dilde (oyunculara gitmez)
  const sat = (ru, tr) => '<li><span class="kare"></span><span><b>' + E(tr) + '</b><span class="ru-alt">' + E(ru) + "</span></span></li>";
  let h = '<div class="yz"><div class="ust-etiket">Yönetici zarfı · Конверт организатора</div><h1>İçindekiler <span>· Содержимое</span></h1>' +
    '<p class="tr">Sayfalar bu sırayla basılır; her sayfanın sağ altında ✉ işaretiyle zarfın adı yazar. · Страницы напечатаны в этом порядке; внизу справа — ✉ и название конверта.</p>' +
    '<h3>Genel · Общее</h3><ul class="ze-liste">' +
    sat("Афиша с общей ссылкой — место сбора", "Ortak link afişi — toplanma yeri") +
    sat("Слово ведущего на старте", "Başlangıç sunucusu metni") +
    sat("Финальный текст — роль Гевхерли Ханым", "Final metni — Gevherli Hanım oyuncusu") + "</ul>" +
    '<h3>Noktalar (rota sırasıyla) — her biri o noktanın görevlisine · Точки — ведущему каждой точки</h3><ul class="ze-liste">';
  halkaSirasi().forEach((id, i) => {
    const s = ist(id), ek = NOKTA_EKLERI[id];
    h += sat((i + 1) + ". " + s.baslik.ru + " (" + s.yer.ru + "): карточка ведущего, лист баллов" + (ek ? ", " + ekMetin(ek.ru) : ""),
      (i + 1) + ". " + s.baslik.tr + " (" + s.yer.tr + "): görevli kartı, puan çizelgesi" + (ek ? ", " + ekMetin(ek.tr) : ""));
  });
  h += "</ul><h3>Yol görevi ödülü · Награда за задание в пути</h3><ul class=\"ze-liste\">" +
    sat("Фрагменты старинной карты (12) — командам, загрузившим фото задания в пути", "Eski harita parçası (12) — yol görevi fotoğrafını yükleyen takımlara") + "</ul>" +
    '<p class="kutu-not" style="margin-top:4mm">Fiziksel ödüller (altın yüzük, baharat kesesi, aynalı kolye, inci, gümüş kutu) basılmaz; görevli kartlarındaki malzeme listesine bakın. · Физические награды не печатаются — см. реквизит в карточках ведущих.</p></div>';
  return sayfa(h, "");
}
function yoneticiZarfi() {
  let s = [yoneticiKapak()].concat(afis(), sunucu(), final());
  halkaSirasi().forEach((id) => { s = s.concat(gorevliSayfalari(id), NOKTA_EKLERI[id] ? NOKTA_EKLERI[id].f() : []); });
  return s.concat(artefaktSayfalari("harita"));
}
function zarfBirimleri() {
  return takimNolari().map((n) => ({ id: "t" + n, ad: "Takım " + n + " zarfı", f: () => zarfIle({ ru: n + " · Команда " + n, tr: "Takım " + n }, () => takimZarfi(n)) }))
    .concat([{ id: "yonetici", ad: "Yönetici zarfı", f: () => zarfIle({ ru: "Организатор", tr: "Yönetici" }, yoneticiZarfi) }]);
}

// ---------- Arayüz ----------
let DUZEN = "zarf";
const SECIM = { zarf: null, bolum: null };
function birimler() { return DUZEN === "zarf" ? zarfBirimleri() : BOLUMLER; }
function ciz() {
  let h = "";
  const sayilar = {}, B = birimler(), secili = SECIM[DUZEN];
  B.forEach((b) => {
    const sayfalar = b.f();
    sayilar[b.id] = sayfalar.length;
    h += '<div class="bolum' + (secili.has(b.id) ? "" : " gizli") + '" data-bolum="' + b.id + '">' + sayfalar.join("") + "</div>";
  });
  $("sayfalar").innerHTML = h;
  const toplam = B.filter((b) => secili.has(b.id)).reduce((s, b) => s + sayilar[b.id], 0);
  $("secim").innerHTML = B.map((b) => '<label><input type="checkbox" data-id="' + b.id + '"' + (secili.has(b.id) ? " checked" : "") + "> " +
    E(b.ad) + " <small>(" + sayilar[b.id] + ")</small></label>").join("") + '<label><b>Seçili: ' + toplam + " sayfa</b></label>";
  $("secim").querySelectorAll("input").forEach((i) => (i.onchange = () => { i.checked ? secili.add(i.dataset.id) : secili.delete(i.dataset.id); ciz(); }));
}
function fotoOku(inp, tur) {
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { FOTO[tur] = r.result; ciz(); };
    r.readAsDataURL(f);
  };
}
function baslat() {
  $("kilit").classList.add("gizli");
  $("arac").classList.remove("gizli");
  const q = new URLSearchParams(location.search).get("bolum"), qd = new URLSearchParams(location.search).get("duzen");
  SECIM.bolum = new Set(q ? q.split(",") : BOLUMLER.map((b) => b.id));
  SECIM.zarf = new Set(zarfBirimleri().map((b) => b.id));
  DUZEN = q || qd === "bolum" ? "bolum" : "zarf";
  $("duzen").value = DUZEN;
  $("duzen").onchange = () => { DUZEN = $("duzen").value; ciz(); };
  let dil = new URLSearchParams(location.search).get("dil");
  if (!dil) { try { dil = localStorage.getItem("kv_baski_dil"); } catch (e) {} }
  RU = dil === "ru";
  $("dilModu").value = RU ? "ru" : "iki";
  $("dilModu").onchange = () => { RU = $("dilModu").value === "ru"; try { localStorage.setItem("kv_baski_dil", RU ? "ru" : "iki"); } catch (e) {} document.body.classList.toggle("yalniz-ru", RU); ciz(); };
  document.body.classList.toggle("yalniz-ru", RU);
  $("tel").value = telefon();
  $("tel").oninput = () => { try { localStorage.setItem("kv_baski_tel", $("tel").value); } catch (e) {} ciz(); };
  fotoOku($("fotoGulhane"), "gulhane");
  fotoOku($("fotoYol"), "yolfoto");
  $("yazdirBtn").onclick = () => window.print();
  $("hepsi").onclick = () => { SECIM[DUZEN] = new Set(birimler().map((b) => b.id)); ciz(); };
  $("hicbiri").onclick = () => { SECIM[DUZEN] = new Set(); ciz(); };
  ciz();
  document.body.dataset.hazir = "1";
}

(async function () {
  try {
    await veriYukle();
    await KONUM_TAZE; // baskıdaki harita QR'ları panelin son konumlarını kullansın
    const r = await fetch("materyal.json?t=" + Date.now());
    M = await r.json();
  } catch (e) {
    document.body.innerHTML = "<p style='padding:24px'>data.json / materyal.json yüklenemedi.</p>";
    return;
  }
  SITE = (VERI.etkinlik.site_url || location.origin + location.pathname.replace(/[^/]*$/, "")).replace(/\/?$/, "/");
  if (await yoneticiOturumu()) { baslat(); return; }
  pinFormuBagla($("kilitForm"), async () => {
    let ok = false;
    try { ok = await yoneticiDogrula($("kilitPin").value); } catch (e2) { $("kilitHata").textContent = "Bağlantı hatası"; return; }
    if (!ok) { $("kilitHata").textContent = "PIN yanlış"; return; }
    baslat();
  });
  $("kilitPin").focus();
})();
