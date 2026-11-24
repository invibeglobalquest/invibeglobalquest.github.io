// Ortak kod: veri, dil, sunucu (Firebase Realtime Database REST), zaman, fotoğraf
"use strict";
const UYGULAMA_SURUM = "24.11i";

let VERI = null;
let DIL = ilkDil();

function ilkDil() {
  try {
    const d = localStorage.getItem("kv_dil");
    if (d === "ru" || d === "tr") return d;
  } catch (e) {}
  return (navigator.language || "").toLowerCase().startsWith("tr") ? "tr" : "ru";
}
function dilDegistir(d) {
  DIL = d;
  try { localStorage.setItem("kv_dil", d); } catch (e) {}
  document.documentElement.lang = d;
}

// ---------- Metinler ----------
const METIN = {
  ru: {
    takimSec: "Выберите свою команду", takim: "Команда", ilkNokta: "Старт: {x}",
    yoneticiLink: "Панель организатора", rota: "Ваш маршрут", baslangicN: "Старт", finalN: "Финал",
    kurallar: "На каждую точку — {d} минут: дорога и задание вместе. Таймер стартует, когда вы завершаете предыдущую точку. На точке загрузите фото — это отметка о прибытии.",
    takimAdi: "Название команды (необязательно)", konumPaylas: "Показывать организатору, где мы (GPS)",
    basla: "Начать квест", degistir: "Сменить команду",
    degistirOnay: "Сменить команду? Прогресс на этом телефоне будет удалён.",
    devamOnay: "Команда {n} уже начала квест на другом телефоне. Продолжить с того же места?",
    fazYol: "В пути", fazGorev: "Задание", fazFinal: "К финалу", fazBitti: "Финиш",
    toplam: "Всего", nokta: "Точка", konumaGit: "Как дойти", hikaye: "Легенда", gorevB: "Задание",
    artefakt: "Артефакт", kosul: "Условие",
    adimFoto: "Когда придёте, сфотографируйте точку — это отметка о прибытии.",
    adim1Baslik: "Фото точки", adim2Baslik: "Фото с наградой", adim2Acik: "Задание выполнено? Сфотографируйте команду с наградой — фото завершит точку.",
    odulFoto: "Загрузить фото с наградой", fotoYok: "Завершить без фото", fotoYokOnay: "Завершить точку без фото?", kilitli: "Откроется после точки {n}",
    geri: "Назад", foto1: "Точка", foto2: "Награда", liderimBtn: "Я лидер",
    fotoCek: "Загрузить фото точки", fotoDegistir: "Заменить фото", fotoHazirlaniyor: "Фото обрабатывается…",
    fotoHata: "Не удалось прочитать фото. Попробуйте ещё раз.",
    varis: "Прибытие {s}", tamamla: "Задание выполнено", tamamlaOnce: "Сначала загрузите фото точки",
    artefaktAldik: "Мы получили артефакт: {a}", tamamlandi: "Выполнено · {s}", plan: "План",
    tumNoktalar: "Все точки маршрута", yolGorevleri: "Задания в пути (бонус)",
    yolGorevAcik: "Можно выполнить в любой момент квеста.", fotoEkle: "Добавить фото", fotoSayisi: "Фото: {n}",
    finalBaslik: "Все точки пройдены!", finaleVardik: "Мы в цистерне",
    bitti: "Квест завершён!", toplamSure: "Общее время", artefaktlar: "Артефакты", puan: "Баллы",
    snkTamam: "сохранено", snkBekliyor: "отправка… ({n})", snkYok: "только на телефоне",
    sureDoldu: "Время вышло!", uzak: "{m} м от точки",
    sifirlandi: "Организатор сбросил данные вашей команды. Выберите команду заново.",
    veriYok: "Не удалось загрузить data.json. Откройте сайт по ссылке (не как файл).",
    sirada: "Дальше", gecikme: "опоздание",
    // yönetici
    pinBaslik: "Вход для организатора", giris: "Войти", pinHata: "Неверный PIN", cikis: "Выйти",
    canli: "Онлайн", siralama: "Рейтинг", ayarlar: "Настройки",
    sBasladi: "Стартовали", sBitirdi: "Финиш", sGecikme: "Опаздывают", sFoto: "Фото",
    dBaslamadi: "Не стартовала", dYol: "Идёт к: {x}", dGorev: "На точке: {x}", dFinal: "Идёт на финал", dBitti: "Финишировала",
    once: "{x} назад", azOnce: "только что", dk: "мин", sn: "с",
    akis: "Лента событий", akisBos: "Пока событий нет.",
    oBasla: "начала квест", oVaris: "прибыла · {x}", oBitis: "выполнила · {x}", oBonus: "бонус-фото · {x}", oFinal: "финишировала в цистерне",
    kNokta: "Точка", kPlan: "План", kVaris: "Прибытие", kBitis: "Готово", kYol: "В пути", kGorev: "На точке",
    sifirla: "Сбросить команду", sifirlaOnay: "Удалить все данные команды {n} (время, фото)? Это нельзя отменить.",
    tumunuSifirla: "Удалить данные всех команд", tumunuOnay: "Удалить данные ВСЕХ команд? Это нельзя отменить.",
    konumlar: "Координаты точек", buradayim: "📍 Я здесь", kaydet: "Сохранить", kaydedildi: "Сохранено",
    tasi: "Перетаскивать точки на карте", tasiOnay: "Сохранить новое место для «{x}»?",
    dogrula: "уточните место", konumHata: "Введите координаты как «41.0075, 28.9743» или вставьте ссылку Google Maps.",
    dbYok: "Общая база не настроена (data.json → senkron_url). Видны только данные этого устройства.",
    bagli: "онлайн", kopuk: "нет связи", kapat: "Закрыть", takimEkrani: "← Экран команды",
    sira: "#", tamamNokta: "Точки", sure: "Время", gpsYok: "нет GPS", haritadaAc: "Открыть карту",
    konumAciklama: "Встаньте у точки и нажмите «Я здесь», введите координаты или включите перетаскивание и передвиньте метку на карте. Команды получат новое место автоматически.",
    baslaOnay: "Начать квест? Таймер команды запустится сразу.", geriAl: "Отменить", geriAlOnay: "Отменить последнюю отметку команды {n}: «{x}»?",
    sureDolduUyari: "Время на эту точку вышло — заканчивайте и идите дальше.",
    pinNot: "PIN меняется в data.json (yonetici_pin).", pinNotGuvenli: "PIN и коды лидеров хранятся в Firebase Authentication; чтобы изменить — напишите разработчику.", ozet: "Сводка", dakikaFmt: "{m} мин",
    izleAcik: "Выберите свою команду, чтобы следить за маршрутом, заданиями и таймером. Отмечает точки только лидер команды по своей личной ссылке.",
    liderMisin: "Вы лидер команды?", liderAcik: "Откройте личную ссылку лидера, которую дал организатор, или введите код.",
    kodGir: "Ввести код лидера", kod: "Код лидера", liderOl: "Войти как лидер", kodHata: "Неверный код для этой команды.",
    linkHata: "Ссылка лидера недействительна. Попросите у организатора новую.",
    izleyiciBant: "Режим просмотра — точки отмечает лидер команды", liderBant: "Вы лидер: только вы отмечаете точки этой команды.",
    bekleniyor: "Ждём старта — лидер команды нажмёт «Начать квест». Экран обновится сам.",
    liderFotoBekle: "Когда команда придёт, лидер загрузит фото точки.", liderBitirecek: "Лидер отметит выполнение задания.",
    guncellendi: "обновлено {x}", izleme: "просмотр", liderCikis: "Выйти из режима лидера",
    liderCikisOnay: "Выйти из режима лидера на этом телефоне? Данные команды сохранятся; войти снова можно по ссылке лидера.",
    linkler: "Ссылки", ortakLink: "Общая ссылка для всех участников", ortakAcik: "Участники выбирают свою команду и только смотрят маршрут, задания и таймер.",
    liderLinkleri: "Личные ссылки лидеров", liderUyari: "Давайте каждую ссылку только лидеру этой команды: кто её откроет, сможет отмечать точки.",
    kopyala: "Копировать", kopyalandi: "Скопировано ✓", yazdir: "🖨 Печать", liderLink: "лидер",
    linkAcik: "Распечатайте или отправьте: общую ссылку — всем, личную ссылку — только лидеру своей команды.",
    baskiPaketi: "📄 Все карточки для печати",
    kolListe: "Список артефактов", kutArtefakt: "Артефакт получен!", kutGorev: "Задание выполнено", kutDevam: "Дальше",
    kutAlt: "«{x}» · артефактов: {n} из {m}", dinle: "Слушать легенду", durdur: "Остановить", lanetKalkti: "Проклятие снято",
    kartKaydet: "Сохранить открытку", kartHazirlaniyor: "Готовим открытку…", organizator: "Организатор квеста", atla: "Пропустить",
    fotolarimiz: "Наши фото", kutBonus: "Бонусное фото добавлено", ekranLink: "Экран для финала",
    guvenlik: "Безопасность", acikMod: "Открытый режим: коды и PIN проверяются на телефоне.", guvenliMod: "Защищённый режим: коды и PIN проверяет Firebase.",
    kurulumBtn: "Настроить защищённый режим", kurulumTamam: "Аккаунты созданы. Теперь вставьте правила ниже в Firebase и сообщите, что готово.",
    kurallarKopyala: "Скопировать правила", girisHata: "Не удалось войти. Проверьте интернет.",
    ekBaslat: "Начать показ", ekTamEkran: "Полный экран", ekSiralama: "Таблица команд", ekFotolar: "Фото квеста", ekFotoYok: "Ждём первые фото…",
    ekOlaylar: "Последние события", ekArtefakt: "Команда {n} получила артефакт", ekFinal: "Команда {n} вернулась в цистерну!", ekBasladi: "с начала квеста"
  },
  tr: {
    takimSec: "Takımınızı seçin", takim: "Takım", ilkNokta: "İlk nokta: {x}",
    yoneticiLink: "Yönetici paneli", rota: "Rotanız", baslangicN: "Başlangıç", finalN: "Final",
    kurallar: "Her nokta için {d} dakika: yol ve görev birlikte. Sayaç önceki noktayı bitirdiğiniz an başlar. Noktada fotoğraf yükleyin — bu varış kaydınızdır.",
    takimAdi: "Takım adı (isteğe bağlı)", konumPaylas: "Yöneticiye konumumuzu göster (GPS)",
    basla: "Questi başlat", degistir: "Takımı değiştir",
    degistirOnay: "Takımı değiştirmek istiyor musunuz? Bu telefondaki ilerleme silinir.",
    devamOnay: "Takım {n} questi başka bir telefonda başlatmış. Kaldığı yerden devam edilsin mi?",
    fazYol: "Yolda", fazGorev: "Görev", fazFinal: "Finale", fazBitti: "Bitti",
    toplam: "Toplam", nokta: "Nokta", konumaGit: "Konuma git", hikaye: "Hikâye", gorevB: "Görev",
    artefakt: "Artefakt", kosul: "Koşul",
    adimFoto: "Noktaya varınca fotoğrafını çekin — bu varış kaydınızdır.",
    adim1Baslik: "Noktanın fotoğrafı", adim2Baslik: "Ödül fotoğrafı", adim2Acik: "Görev bitti mi? Takımı ödülle birlikte fotoğraflayın — nokta bu fotoğrafla tamamlanır.",
    odulFoto: "Ödül fotoğrafını yükle", fotoYok: "Fotoğrafsız bitir", fotoYokOnay: "Nokta fotoğrafsız tamamlansın mı?", kilitli: "{n}. noktadan sonra açılır",
    geri: "Geri", foto1: "Nokta", foto2: "Ödül", liderimBtn: "Liderim",
    fotoCek: "Noktanın fotoğrafını yükle", fotoDegistir: "Fotoğrafı değiştir", fotoHazirlaniyor: "Fotoğraf hazırlanıyor…",
    fotoHata: "Fotoğraf okunamadı. Tekrar deneyin.",
    varis: "Varış {s}", tamamla: "Görev tamamlandı", tamamlaOnce: "Önce noktanın fotoğrafını yükleyin",
    artefaktAldik: "Artefaktı aldık: {a}", tamamlandi: "Tamamlandı · {s}", plan: "Plan",
    tumNoktalar: "Rotadaki tüm noktalar", yolGorevleri: "Yol görevleri (bonus)",
    yolGorevAcik: "Quest boyunca istediğiniz an yapabilirsiniz.", fotoEkle: "Fotoğraf ekle", fotoSayisi: "{n} fotoğraf",
    finalBaslik: "Tüm noktalar tamam!", finaleVardik: "Sarnıca vardık",
    bitti: "Quest tamamlandı!", toplamSure: "Toplam süre", artefaktlar: "Artefaktlar", puan: "Puan",
    snkTamam: "kaydedildi", snkBekliyor: "gönderiliyor… ({n})", snkYok: "yalnızca bu telefonda",
    sureDoldu: "Süre doldu!", uzak: "noktaya {m} m",
    sifirlandi: "Yönetici takımınızın verilerini sıfırladı. Takımı yeniden seçin.",
    veriYok: "data.json yüklenemedi. Siteyi dosya olarak değil, bağlantıdan açın.",
    sirada: "Sırada", gecikme: "gecikme",
    pinBaslik: "Yönetici girişi", giris: "Giriş", pinHata: "PIN yanlış", cikis: "Çıkış",
    canli: "Canlı", siralama: "Sıralama", ayarlar: "Ayarlar",
    sBasladi: "Başlayan", sBitirdi: "Bitiren", sGecikme: "Gecikmede", sFoto: "Fotoğraf",
    dBaslamadi: "Başlamadı", dYol: "Yolda: {x}", dGorev: "Noktada: {x}", dFinal: "Finale gidiyor", dBitti: "Bitirdi",
    once: "{x} önce", azOnce: "az önce", dk: "dk", sn: "sn",
    akis: "Olay akışı", akisBos: "Henüz olay yok.",
    oBasla: "questi başlattı", oVaris: "vardı · {x}", oBitis: "tamamladı · {x}", oBonus: "bonus fotoğraf · {x}", oFinal: "sarnıca vardı (final)",
    kNokta: "Nokta", kPlan: "Plan", kVaris: "Varış", kBitis: "Bitiş", kYol: "Yol", kGorev: "Görev",
    sifirla: "Takımı sıfırla", sifirlaOnay: "Takım {n} için tüm veriler (zamanlar, fotoğraflar) silinsin mi? Geri alınamaz.",
    tumunuSifirla: "Tüm takımların verilerini sil", tumunuOnay: "TÜM takımların verileri silinsin mi? Geri alınamaz.",
    konumlar: "Nokta konumları", buradayim: "📍 Bulunduğum yer", kaydet: "Kaydet", kaydedildi: "Kaydedildi",
    tasi: "Noktaları haritada sürükle", tasiOnay: "«{x}» için yeni konum kaydedilsin mi?",
    dogrula: "konumu doğrulayın", konumHata: "Koordinatı «41.0075, 28.9743» biçiminde yazın veya Google Maps bağlantısı yapıştırın.",
    dbYok: "Ortak veritabanı ayarlı değil (data.json → senkron_url). Yalnızca bu cihazdaki veriler görünür.",
    bagli: "canlı", kopuk: "bağlantı yok", kapat: "Kapat", takimEkrani: "← Takım ekranı",
    sira: "#", tamamNokta: "Nokta", sure: "Süre", gpsYok: "GPS yok", haritadaAc: "Haritada aç",
    konumAciklama: "Noktanın yanında durup «Bulunduğum yer»e basın, koordinat yazın ya da sürüklemeyi açıp haritadaki işareti taşıyın. Takımlar yeni konumu otomatik alır.",
    baslaOnay: "Quest başlasın mı? Takımın sayacı hemen başlar.", geriAl: "Geri al", geriAlOnay: "Takım {n} için son işaret geri alınsın mı: «{x}»?",
    sureDolduUyari: "Bu noktanın süresi doldu — bitirip devam edin.",
    pinNot: "PIN, data.json içindeki yonetici_pin alanından değiştirilir.", pinNotGuvenli: "PIN ve lider kodları Firebase Authentication'da; değiştirmek için geliştiriciye yazın.", ozet: "Özet", dakikaFmt: "{m} dk",
    izleAcik: "Rotayı, görevleri ve sayacı izlemek için takımınızı seçin. Noktaları yalnızca takım lideri kendi özel linkiyle işaretler.",
    liderMisin: "Takım lideri misiniz?", liderAcik: "Organizatörün verdiği lider linkini açın veya kodu girin.",
    kodGir: "Lider kodunu gir", kod: "Lider kodu", liderOl: "Lider olarak gir", kodHata: "Bu takım için kod yanlış.",
    linkHata: "Lider linki geçersiz. Organizatörden yenisini isteyin.",
    izleyiciBant: "İzleme modu — noktaları takım lideri işaretler", liderBant: "Liderisiniz: bu takımın noktalarını yalnızca siz işaretlersiniz.",
    bekleniyor: "Başlangıç bekleniyor — takım lideri «Questi başlat»a basacak. Ekran kendiliğinden güncellenir.",
    liderFotoBekle: "Takım noktaya varınca lider fotoğrafı yükleyecek.", liderBitirecek: "Görev bitince lider işaretleyecek.",
    guncellendi: "güncellendi {x}", izleme: "izleme", liderCikis: "Lider modundan çık",
    liderCikisOnay: "Bu telefonda lider modundan çıkılsın mı? Takımın verileri korunur; lider linkiyle tekrar girebilirsiniz.",
    linkler: "Linkler", ortakLink: "Tüm katılımcılar için ortak link", ortakAcik: "Katılımcılar takımını seçer; rotayı, görevleri ve sayacı yalnızca izler.",
    liderLinkleri: "Lider linkleri", liderUyari: "Her linki yalnızca o takımın liderine verin: linki açan herkes noktaları işaretleyebilir.",
    kopyala: "Kopyala", kopyalandi: "Kopyalandı ✓", yazdir: "🖨 Yazdır", liderLink: "lider",
    linkAcik: "Yazdırın veya gönderin: ortak linki herkese, lider linkini yalnızca o takımın liderine.",
    baskiPaketi: "📄 Tüm baskı kartları",
    kolListe: "Artefakt listesi", kutArtefakt: "Artefakt kazanıldı!", kutGorev: "Görev tamamlandı", kutDevam: "Devam",
    kutAlt: "«{x}» · artefakt: {n}/{m}", dinle: "Hikâyeyi dinle", durdur: "Durdur", lanetKalkti: "Lanet kaldırıldı",
    kartKaydet: "Hatıra kartını kaydet", kartHazirlaniyor: "Kart hazırlanıyor…", organizator: "Quest organizatörü", atla: "Geç",
    fotolarimiz: "Fotoğraflarımız", kutBonus: "Bonus fotoğraf eklendi", ekranLink: "Final ekranı",
    guvenlik: "Güvenlik", acikMod: "Açık mod: kodlar ve PIN telefonda kontrol edilir.", guvenliMod: "Güvenli mod: kodları ve PIN'i Firebase kontrol eder.",
    kurulumBtn: "Güvenli modu kur", kurulumTamam: "Hesaplar oluşturuldu. Şimdi aşağıdaki kuralları Firebase'e yapıştırın ve bana haber verin.",
    kurallarKopyala: "Kuralları kopyala", girisHata: "Giriş yapılamadı. İnterneti kontrol edin.",
    ekBaslat: "Gösterimi başlat", ekTamEkran: "Tam ekran", ekSiralama: "Takım sıralaması", ekFotolar: "Quest fotoğrafları", ekFotoYok: "İlk fotoğraflar bekleniyor…",
    ekOlaylar: "Son olaylar", ekArtefakt: "Takım {n} artefakt kazandı", ekFinal: "Takım {n} sarnıca döndü!", ekBasladi: "başlangıçtan beri"
  }
};
function t(k, v) {
  let s = (METIN[DIL] && METIN[DIL][k]) ?? METIN.tr[k] ?? k;
  if (v) for (const a in v) s = s.split("{" + a + "}").join(v[a]);
  return s;
}
// Çok dilli alan: {ru:"..", tr:".."}
function TL(o) {
  if (o == null) return "";
  if (typeof o === "string" || Array.isArray(o)) return o;
  return o[DIL] ?? o.tr ?? o.ru ?? "";
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const $ = (id) => document.getElementById(id);

// ---------- Veri ----------
// İçerik güvencesi: data.json bozuk ya da eksik kaydedilirse telefonlar son sağlam sürümle
// çalışmaya devam eder; yönetici panelinde kırmızı uyarı çıkar.
const A_VERI = "kv_veri_saglam";
let VERI_SORUN = null; // { hatalar: [...], yedek: true/false }
function veriDenetle(v) {
  const h = [];
  if (!v || typeof v !== "object") return ["dosya boş"];
  if (!v.etkinlik || !v.etkinlik.ad) h.push("etkinlik.ad eksik");
  if (!v.baslangic || !isFinite(v.baslangic.lat) || !isFinite(v.baslangic.lng)) h.push("baslangic konumu eksik");
  const ist = v.istasyonlar && typeof v.istasyonlar === "object" ? v.istasyonlar : null;
  if (!ist || !Object.keys(ist).length) h.push("istasyonlar eksik");
  else for (const id in ist) {
    const n = ist[id] || {};
    if (!isFinite(n.lat) || !isFinite(n.lng)) h.push(id + ": konum (lat/lng) hatalı");
    for (const a of ["baslik", "gorev"]) for (const d of ["ru", "tr"]) if (!n[a] || !n[a][d] || !n[a][d].length) h.push(id + ": " + a + "." + d + " eksik");
  }
  const r = v.rotalar;
  if (!r || typeof r !== "object" || !Object.keys(r).length) h.push("rotalar eksik");
  else for (const t in r) {
    const x = r[t];
    if (!Array.isArray(x) || !x.length) { h.push("rota " + t + " boş"); continue; }
    x.forEach((id) => { if (!ist || !ist[id]) h.push("rota " + t + ": \"" + id + "\" adında nokta yok"); });
    if (new Set(x).size !== x.length) h.push("rota " + t + ": aynı nokta iki kez");
  }
  return h;
}
async function veriYukle() {
  let v = null, hatalar = [], icerik = false;
  try {
    const r = await fetch("data.json?t=" + Date.now());
    if (!r.ok) throw new Error("HTTP " + r.status);
    const txt = await r.text();
    icerik = true;
    try { v = JSON.parse(txt); hatalar = veriDenetle(v); }
    catch (e) { v = null; hatalar = ["yazım hatası (virgül, tırnak, parantez): " + e.message]; }
  } catch (e) { hatalar = ["indirilemedi: " + e.message]; }
  if (v && !hatalar.length) {
    VERI_SORUN = null;
    try { localStorage.setItem(A_VERI, JSON.stringify(v)); } catch (e) {}
  } else {
    let yedek = null;
    try { yedek = JSON.parse(localStorage.getItem(A_VERI) || "null"); } catch (e) {}
    if (yedek && !veriDenetle(yedek).length) v = yedek;
    if (!v) throw new Error("data.json: " + hatalar.join("; "));
    VERI_SORUN = icerik ? { hatalar, yedek: v === yedek } : null;
  }
  VERI = v;
  // Panelden kaydedilen konumlar: son bilinen anında (çevrimdışı da), tazesi arka planda;
  // ilk ekran Firebase'i beklemez
  let onceki = null;
  try { onceki = JSON.parse(localStorage.getItem(A_KONUM) || "null"); } catch (e) {}
  if (onceki) await konumlariUygula(onceki);
  KONUM_TAZE = konumlariTazele();
  return VERI;
}
const A_KONUM = "kv_konumlar";
let KONUM_TAZE = Promise.resolve(false);
async function konumlariTazele() {
  if (!DB.var()) return false;
  let k;
  try { k = await DB.get("ayarlar/konumlar"); } catch (e) { return false; }
  const yeni = JSON.stringify(k || null);
  let eski = "null";
  try { eski = localStorage.getItem(A_KONUM) || "null"; localStorage.setItem(A_KONUM, yeni); } catch (e) {}
  if (yeni === eski) return false;
  await konumlariUygula(k || null);
  if (typeof window.konumlarDegisti === "function") window.konumlarDegisti();
  return true;
}
// Yöneticinin panelden kaydettiği konumlar data.json'dakileri ezer
async function konumlariUygula(hazir) {
  let k = hazir;
  if (k === undefined) {
    if (!DB.var()) return;
    try { k = await DB.get("ayarlar/konumlar"); } catch (e) { return; }
  }
  if (!k) return;
  for (const id in k) {
    const n = nokta(id);
    if (n && k[id] && isFinite(k[id].lat) && isFinite(k[id].lng)) {
      n.lat = +k[id].lat; n.lng = +k[id].lng; n.dogrula = false;
    }
  }
}
function nokta(id) {
  if (!VERI) return null;
  if (id === VERI.baslangic.id) return VERI.baslangic;
  return VERI.istasyonlar[id] || null;
}
function noktaAdi(id) {
  const n = nokta(id);
  if (!n) return id;
  return n.baslik ? TL(n.baslik) : TL(n.ad);
}
function rotaAl(takim, kayit) {
  const r = kayit && Array.isArray(kayit.rota) ? kayit.rota : VERI.rotalar[takim];
  return (r || []).filter((id) => VERI.istasyonlar[id]);
}
function takimNolari() {
  return Object.keys(VERI.rotalar).sort((a, b) => a - b);
}

// ---------- Güvenli mod (Firebase Authentication REST) ----------
// data.json → etkinlik.firebase_api_key + guvenli:true olunca aktif. Yoksa açık mod (eski davranış).
const GUVEN = {
  anahtar: "kv_oturum",
  kurulum: false,
  oturum: null,
  key() { return ((VERI && VERI.etkinlik.firebase_api_key) || "").trim(); },
  aktif() { return !!this.key() && (!!VERI.etkinlik.guvenli || this.kurulum); },
  alan() { return VERI.etkinlik.hesap_alani || "invibequest.app"; },
  oku() { if (this.oturum) return this.oturum; try { this.oturum = JSON.parse(localStorage.getItem(this.anahtar)); } catch (e) {} return this.oturum; },
  yaz(o) { this.oturum = o; try { o ? localStorage.setItem(this.anahtar, JSON.stringify(o)) : localStorage.removeItem(this.anahtar); } catch (e) {} },
  async post(url, govde, form) {
    const r = await fetch(url + "?key=" + encodeURIComponent(this.key()), {
      method: "POST",
      headers: { "Content-Type": form ? "application/x-www-form-urlencoded" : "application/json" },
      body: form ? new URLSearchParams(govde).toString() : JSON.stringify(govde)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error((j.error && j.error.message) || "HTTP " + r.status); e.kod = e.message; throw e; }
    return j;
  },
  idUrl(yol) { return (VERI.etkinlik.auth_url || "https://identitytoolkit.googleapis.com") + "/v1/" + yol; },
  kaydet(j, email) {
    const o = { email: email || j.email || "", idToken: j.idToken || j.id_token, refreshToken: j.refreshToken || j.refresh_token,
      exp: Date.now() + (+(j.expiresIn || j.expires_in || 3600)) * 1000 - 120000 };
    this.yaz(o);
    return o;
  },
  async giris(email, sifre) { return this.kaydet(await this.post(this.idUrl("accounts:signInWithPassword"), { email, password: sifre, returnSecureToken: true }), email); },
  async kayit(email, sifre) { return this.post(this.idUrl("accounts:signUp"), { email, password: sifre, returnSecureToken: true }); },
  // aynı anda gelen istekler tek anonim hesap paylaşır
  anonim() {
    if (!this._anon) this._anon = this.post(this.idUrl("accounts:signUp"), { returnSecureToken: true })
      .then((j) => {
        // bu arada lider/yönetici giriş yaptıysa onun oturumu korunur (anonim onu asla ezmez)
        const o = this.oku();
        return o && o.email ? o : this.kaydet(j, "");
      }).finally(() => { this._anon = null; });
    return this._anon;
  },
  async yenile(o) {
    const url = (VERI.etkinlik.token_url || "https://securetoken.googleapis.com") + "/v1/token";
    return this.kaydet(await this.post(url, { grant_type: "refresh_token", refresh_token: o.refreshToken }, true), o.email);
  },
  // İzleyici hesap açmadan okur (Firebase aynı IP'den saatte 100 yeni hesap sınırı koyar;
  // 150 kişi aynı Wi-Fi'de olabilir). Kurallar okumak için giriş isterse istek() bir kez anonime düşer.
  async token() {
    if (!this.aktif()) return null;
    let o = this.oku();
    if (!o || !o.refreshToken) return null;
    if (Date.now() > o.exp) {
      try { o = await this.yenile(o); } catch (e) { if (!o.email) { this.yaz(null); return null; } throw e; }
    }
    return o.idToken;
  },
  cikis() { this.yaz(null); },
  eposta(rol, n) { return (rol === "yonetici" ? "yonetici" : "takim" + n) + "@" + this.alan(); },
  sifre(rol, deger) { return rol === "yonetici" ? "quest#" + String(deger).trim() : String(deger).replace(/\s+/g, "").toUpperCase(); }
};
// PIN formu: sayfa hazır olmadan gönderilirse (yavaş bağlantı) kaybolmaz, hazır olunca işlenir;
// doğrulama sürerken düğme kilitli kalır (çift basma yok)
function pinFormuBagla(form, isle) {
  const btn = form.querySelector("button");
  form.onsubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (btn && btn.disabled) return;
    if (btn) btn.disabled = true;
    try { await isle(); } finally { if (btn) btn.disabled = false; }
  };
  if (window.pinBekliyor) { window.pinBekliyor = false; form.onsubmit(); }
}
// Lider kodunu doğrular (güvenli modda Firebase'e giriş yaparak)
async function liderDogrula(n, kod) {
  if (!GUVEN.aktif()) {
    const k = (VERI.lider_kodlari || {})[n];
    return !!k && String(kod || "").replace(/\s+/g, "").toUpperCase() === String(k).toUpperCase();
  }
  try { await GUVEN.giris(GUVEN.eposta("lider", n), GUVEN.sifre("lider", kod)); return true; }
  catch (e) { if (/INVALID|PASSWORD|NOT_FOUND|CREDENTIAL/.test(e.kod || "")) return false; throw e; }
}
// Yönetici PIN'ini doğrular; başarılıysa lider kodlarını da yükler
async function yoneticiDogrula(pin) {
  if (!GUVEN.aktif()) {
    const ok = String(pin || "").trim() === String(VERI.etkinlik.yonetici_pin);
    if (ok) try { localStorage.setItem("kv_yonetici", String(pin).trim()); } catch (e) {}
    return ok;
  }
  try { await GUVEN.giris(GUVEN.eposta("yonetici"), GUVEN.sifre("yonetici", pin)); }
  catch (e) { if (/INVALID|PASSWORD|NOT_FOUND|CREDENTIAL/.test(e.kod || "")) return false; throw e; }
  await liderKodlariYukle();
  return true;
}
// Daha önce giriş yapılmış mı (sayfa yenilenince PIN sormamak için)
async function yoneticiOturumu() {
  if (!GUVEN.aktif()) {
    let k = null;
    try { k = localStorage.getItem("kv_yonetici"); } catch (e) {}
    return String(k || "").trim() === String(VERI.etkinlik.yonetici_pin);
  }
  const o = GUVEN.oku();
  if (!o || o.email !== GUVEN.eposta("yonetici")) return false;
  try { await GUVEN.token(); await liderKodlariYukle(); return true; } catch (e) { return false; }
}
async function liderKodlariYukle() {
  if (GUVEN.aktif()) { try { VERI.lider_kodlari = (await DB.get("gizli/kodlar")) || {}; } catch (e) { VERI.lider_kodlari = VERI.lider_kodlari || {}; } }
}
function yoneticiCikis() {
  try { localStorage.removeItem("kv_yonetici"); } catch (e) {}
  if (GUVEN.aktif()) GUVEN.cikis();
}

// ---------- Sunucu (Firebase Realtime Database REST API) ----------
const DB = {
  url() {
    const u = (VERI && VERI.etkinlik.senkron_url || "").trim().replace(/\/+$/, "");
    return u || null;
  },
  var() { return !!this.url(); },
  // sure: zayıf şebekede asılı kalan istek kuyruğu kilitlemesin diye zaman sınırı (ms)
  async istek(method, yol, govde, sure) {
    const u = this.url();
    if (!u) throw new Error("sunucu yok");
    const ac = typeof AbortController === "function" ? new AbortController() : null;
    const opt = { method, headers: {}, signal: ac ? ac.signal : undefined };
    if (govde !== undefined) { opt.body = JSON.stringify(govde); opt.headers["Content-Type"] = "application/json"; }
    const tk = await GUVEN.token();
    const z = ac ? setTimeout(() => ac.abort(), sure || 20000) : 0;
    try {
      const r = await fetch(u + "/" + yol + ".json" + (tk ? "?auth=" + encodeURIComponent(tk) : ""), opt);
      if (r.status === 401 && !tk && GUVEN.aktif()) { clearTimeout(z); await GUVEN.anonim(); return this.istek(method, yol, govde, sure); }
      if (!r.ok) throw new Error("HTTP " + r.status);
      const txt = await r.text();
      return txt ? JSON.parse(txt) : null;
    } finally { clearTimeout(z); }
  },
  get(yol) { return this.istek("GET", yol); },
  put(yol, v) { return this.istek("PUT", yol, v); },
  patch(yol, v) { return this.istek("PATCH", yol, v); },
  sil(yol) { return this.istek("DELETE", yol); },

  // Canlı izleme: önce EventSource (akış), olmazsa 10 sn'de bir sorgu
  izle(yol, cb, durumCb) {
    let agac = null, es = null, zaman = null, hataSay = 0, kapali = false;
    const bildir = () => cb(agac);
    const sorgula = async () => {
      try { agac = await this.get(yol); durumCb && durumCb(true); bildir(); }
      catch (e) { durumCb && durumCb(false); }
    };
    const yokla = () => { clearInterval(zaman); sorgula(); zaman = setInterval(sorgula, 10000); };
    if (typeof EventSource === "undefined") { yokla(); return { kapat() { clearInterval(zaman); } }; }
    const ac = async () => {
      if (kapali) return;
      let tk = null;
      try { tk = await GUVEN.token(); } catch (e) { durumCb && durumCb(false); setTimeout(ac, 10000); return; }
      es = new EventSource(this.url() + "/" + yol + ".json" + (tk ? "?auth=" + encodeURIComponent(tk) : ""));
      const isle = (patch) => (ev) => {
        try {
          const m = JSON.parse(ev.data);
          if (!m) return;
          hataSay = 0;
          agac = agacUygula(agac, m.path, m.data, patch);
          durumCb && durumCb(true);
          bildir();
        } catch (e) {}
      };
      es.addEventListener("put", isle(false));
      es.addEventListener("patch", isle(true));
      es.addEventListener("keep-alive", () => durumCb && durumCb(true));
      // jeton süresi dolunca Firebase akışı keser: yenileyip yeniden bağlan
      const yeniden = () => { es.close(); const o = GUVEN.oku(); if (o) { o.exp = 0; GUVEN.yaz(o); } setTimeout(ac, 500); };
      es.addEventListener("auth_revoked", yeniden);
      es.addEventListener("cancel", yeniden);
      let anonDenendi = false;
      es.onerror = async () => {
        durumCb && durumCb(false);
        // kurallar okumak için giriş istiyorsa bir kez anonim oturumla yeniden bağlan
        if (!tk && GUVEN.aktif() && !anonDenendi) { anonDenendi = true; es.close(); try { await GUVEN.anonim(); } catch (e) {} setTimeout(ac, 300); return; }
        if (++hataSay >= 4) { es.close(); yokla(); }
      };
    };
    ac();
    return { kapat() { kapali = true; es && es.close(); clearInterval(zaman); } };
  }
};
// Akıştan gelen put/patch olaylarını yerel ağaca uygular
function agacUygula(kok, yol, veri, patch) {
  const p = String(yol || "/").split("/").filter(Boolean);
  if (patch) {
    for (const k in veri || {}) kok = agacKoy(kok, p.concat(k.split("/").filter(Boolean)), veri[k]);
    return kok;
  }
  return agacKoy(kok, p, veri);
}
function agacKoy(kok, p, v) {
  if (!p.length) return v;
  const o = kok && typeof kok === "object" ? Array.isArray(kok) ? Object.assign({}, kok) : kok : {};
  const [b, ...geri] = p;
  const yeni = agacKoy(o[b], geri, v);
  if (yeni === null || yeni === undefined) delete o[b]; else o[b] = yeni;
  return Object.keys(o).length ? o : null;
}

// ---------- Zaman ----------
function saat(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString(DIL === "tr" ? "tr-TR" : "ru-RU", { hour: "2-digit", minute: "2-digit" });
}
function sureYaz(ms) {
  const neg = ms < 0;
  let s = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const pad = (x) => String(x).padStart(2, "0");
  return (neg ? "+" : "") + (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(s);
}
function dakika(ms) { return ms == null ? "—" : Math.max(0, Math.round(ms / 60000)) + " " + t("dk"); }
function onceYaz(ts, simdi = Date.now()) {
  if (!ts) return "—";
  const d = Math.floor((simdi - ts) / 1000);
  if (d < 45) return t("azOnce");
  if (d < 3600) return t("once", { x: Math.round(d / 60) + " " + t("dk") });
  return t("once", { x: Math.floor(d / 3600) + ":" + String(Math.floor((d % 3600) / 60)).padStart(2, "0") });
}
// Her nokta için tek süre: yol + görev birlikte (önceki nokta bitince başlar)
function noktaDk() { const e = VERI.etkinlik; return e.nokta_dk || ((e.yol_dk || 10) + (e.gorev_dk || 5)); }
function noktaMs() { return noktaDk() * 60000; }
// i. istasyonun planlanan zaman dilimi (başlangıçtan itibaren)
function planDilim(baslangic, i) {
  const bas = baslangic + i * noktaMs();
  return [bas, bas + noktaMs()];
}

// Bir takımın anlık durumu (takım ekranı ve yönetici aynı hesabı kullanır)
function durumHesapla(k, rota, simdi = Date.now()) {
  if (!k || !k.baslangic) return { faz: "baslamadi", tamam: 0 };
  const ad = k.adimlar || {};
  let onceki = k.baslangic;
  for (let i = 0; i < rota.length; i++) {
    const a = ad[rota[i]] || {};
    if (!a.bitis) {
      return { faz: a.varis ? "gorev" : "yol", i, id: rota[i], bas: onceki, limit: noktaMs(), kalan: noktaMs() - (simdi - onceki), tamam: i };
    }
    onceki = a.bitis;
  }
  if (!k.final) return { faz: "final", i: rota.length, bas: onceki, limit: noktaMs(), kalan: noktaMs() - (simdi - onceki), tamam: rota.length };
  return { faz: "bitti", tamam: rota.length, toplam: k.final - k.baslangic };
}

// ---------- Konum ----------
function haritaLink(lat, lng) {
  return "https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=" + lat + "," + lng;
}
function mesafe(a, b) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

// ---------- Fotoğraf ----------
// Telefondan gelen büyük fotoğrafı küçültür: {buyuk, kucuk} (JPEG data URL)
async function fotoHazirla(dosya) {
  const url = URL.createObjectURL(dosya);
  try {
    const img = await new Promise((ok, hata) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = hata;
      i.src = url;
    });
    const ciz = (max, q) => {
      const o = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * o));
      c.height = Math.max(1, Math.round(img.naturalHeight * o));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", q);
    };
    return { buyuk: ciz(1280, 0.72), kucuk: ciz(320, 0.6) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---------- Ortak arayüz ----------
function dilDugmeleri(kutu, sonra) {
  kutu.innerHTML = "";
  ["ru", "tr"].forEach((d) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = d.toUpperCase();
    b.className = "dil-btn" + (d === DIL ? " secili" : "");
    b.setAttribute("aria-pressed", d === DIL);
    b.onclick = () => { dilDegistir(d); dilDugmeleri(kutu, sonra); sonra(); };
    kutu.appendChild(b);
  });
}
function fotoGoster(src, baslik) {
  let k = $("lightbox");
  if (!k) {
    k = document.createElement("div");
    k.id = "lightbox";
    k.className = "lightbox";
    k.innerHTML = '<button type="button" class="lb-kapat" aria-label="×">×</button><img alt=""><p></p>';
    k.onclick = (e) => { if (e.target === k || e.target.classList.contains("lb-kapat")) k.classList.remove("acik"); };
    document.body.appendChild(k);
  }
  k.querySelector("img").src = src;
  k.querySelector("p").textContent = baslik || "";
  k.classList.add("acik");
  return k.querySelector("img");
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { const k = $("lightbox"); if (k) k.classList.remove("acik"); }
});

// ---------- Sesli anlatım (tarayıcının kendi sesi) ----------
function sesVar() { return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined"; }
function dinleBtn(metin) {
  if (!sesVar()) return "";
  return '<button type="button" class="dinle-btn" data-metin="' + esc(metin) + '">' + (typeof ikon === "function" ? ikon("ses") : "") + "<span>" + esc(t("dinle")) + "</span></button>";
}
let sesBtn = null;
function dinleBagla(kok) {
  (kok || document).querySelectorAll(".dinle-btn").forEach((b) => {
    b.onclick = (e) => {
      e.preventDefault();
      const ss = window.speechSynthesis;
      if (sesBtn === b && ss.speaking) { ss.cancel(); return; }
      ss.cancel();
      const u = new SpeechSynthesisUtterance(b.dataset.metin);
      const dil = DIL === "tr" ? "tr" : "ru";
      u.lang = dil === "tr" ? "tr-TR" : "ru-RU";
      const ses = ss.getVoices().find((v) => (v.lang || "").toLowerCase().startsWith(dil));
      if (ses) u.voice = ses;
      u.rate = 0.95;
      const ayarla = (calisiyor) => { b.classList.toggle("calisiyor", calisiyor); b.querySelector("span").textContent = t(calisiyor ? "durdur" : "dinle"); };
      if (sesBtn && sesBtn !== b) { sesBtn.classList.remove("calisiyor"); sesBtn.querySelector("span").textContent = t("dinle"); }
      sesBtn = b;
      u.onend = u.onerror = () => ayarla(false);
      ayarla(true);
      ss.speak(u);
    };
  });
}
function swKaydet() {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
}
