# Проклятье 1001 колонны · 1001 Direğin Laneti — Quest sitesi

10 takımlık Sultanahmet quest'i için telefonda çalışan web sitesi. Adres: **https://invibeglobalquest.github.io/**

| Kim | Hangi link | Ne yapabilir |
|---|---|---|
| Tüm katılımcılar | Ortak link `https://invibeglobalquest.github.io/` | Takımını seçer; rotayı, görevleri, sayacı ve fotoğrafları **yalnızca izler** |
| Takım lideri | Kendi lider linki `…/?t=3&k=KOD` (veya ortak linkte "Lider kodunu gir") | Başlatır, fotoğraf yükler, **Görev tamamlandı**'ya basar |
| Ana yönetici | Ortak linkin altındaki **🔒 Yönetici paneli** (PIN) | Tüm takımları canlı izler, puan verir, konumları düzeltir |

Lider linkleri ve QR kodları yönetici panelinde **Linkler** sekmesinde. Etkinliğin bütün basılı malzemesi **Baskı paketi**nde: https://invibeglobalquest.github.io/baski.html (yönetici PIN'i).

## Baskı paketi (`baski.html`)
A4, 76 sayfa; bölüm bölüm seçilip yazdırılır (Yazdır penceresi: kenar boşluğu «Yok», arka plan grafikleri açık, üstbilgi/altbilgi kapalı).

| Bölüm | Adet | Kime |
|---|---|---|
| Ortak link afişi | 1 | Toplanma yeri |
| Takım zarfı kartı (lider QR + kod, rota, kurallar, üyeler için izleme QR'ı) | 10 | Liderler |
| Yol görevi fotoğrafı | 10 | Takım zarfları |
| Başlangıç sunucusu metni (RU + TR) | 1 | Sunucu |
| Görevli kartı + puan çizelgesi (takımlar beklenen varış sırasıyla) | 10 + 10 | Nokta görevlileri |
| Tekerleme kartları (Kiril okunuşu + Rusça anlam) | 2 takım | Simitçi |
| Atasözü kartları (Rusça başı/devamı + anlamı) | 20 | Amfitiyatro |
| Hanımın Oyunu kartları (6 oyun, kibrit cevapları) | 6 | Usta |
| Şifre zarfı (hiyeroglif alfabe + cevap kutuları) + dikilitaş afişi | 10 + 1 | Dikilitaş |
| Baharat listesi (10 baharat, toplam 30 g) | 10 | Baharatçı |
| Alışveriş listesi | 10 | Pazarlık |
| Gülhane fark kartı | 10 | Gülhane |
| Kâğıt artefaktlar (büyü sözü, hatıra, artefakt ve harita parçası) | 12'şer | İlgili noktalar |
| Gevherli'nin mühürlü mektubu | 10 | Simitçi |
| Final metni (RU + TR) | 1 | Gevherli oyuncusu |

Metinler `materyal.json` dosyasındadır (tekerlemeler, atasözleri, oyunlar, şifre cümlesi ve alfabesi, baharatlar, alışveriş listesi, mektup, sunucu ve final metni, görevlilerin puanlama kuralları). Gülhane ve yol görevi fotoğrafları sayfada seçilir; organizatör telefonu sayfadaki kutuya yazılınca takım zarflarına basılır.

Site Rusça ve Türkçe çalışır (sağ üstteki RU / TR). Derleme gerekmez; HTML/CSS/JS ve `data.json`'dan oluşur.

## Takım ekranı nasıl işler? (lider)
1. Lider kendi linkini açar → efsane, rota (Başlangıç: Binbirdirek Sarnıcı → 10 nokta → Final: Sarnıç) ve kurallar görünür → **Questi başlat**.
2. Üstte büyük sayaç: **her nokta için 15 dk (yol + görev birlikte)**; önceki nokta bitince başlar (`data.json → nokta_dk`). Süre aşılırsa sayaç kırmızıya döner, `+02:15 gecikme` gösterir; telefon titrer, kısa bir uyarı sesi çalar ve üstte uyarı çıkar. Oyun sırasında lider telefonunun ekranı kendiliğinden kapanmaz (GPS ve uyarılar çalışmaya devam eder).
3. Sıradaki nokta kartında: **📍 Konuma git** (Google Maps yürüyüş yol tarifi), hikâye, görev maddeleri, koşul ve kazanılacak artefakt.
4. **Adım 1 — fotoğraf:** Noktaya varınca noktanın fotoğrafı yüklenir. Bu, varış kaydıdır ve görev sayacını başlatır (GPS açıksa noktaya uzaklık da kaydedilir).
5. **Adım 2 — ✅ Görev tamamlandı:** Saat kaydedilir (`Tamamlandı · 14:32`), sıradaki noktanın yol sayacı başlar. "Artefaktı aldık" kutusu da işaretlenir.
6. "Rotadaki tüm noktalar" listesinde her noktaya basınca konuma git + görev açılır; her noktanın **plan saat dilimi** (ör. `Plan 12:10–12:20`) ve gerçek saatleri görünür.
7. **Yol görevleri (bonus):** «Следы исчезнувшей хозяйки» (harita parçası), «Взгляд сверху», «Стражи квартала» — istenen an fotoğraf eklenir.
8. 10 nokta bitince final kartı: Sarnıç'a git → **🏁 Sarnıca vardık**.

İnternet kesilirse kayıtlar telefonda bekler ve bağlantı gelince otomatik gönderilir (üstte "gönderiliyor… (n)").
Lider telefon değiştirirse lider linkini yeni telefonda açar; takım kaldığı yerden devam eder.

**Takım üyeleri (izleme modu):** Aynı ekranı görür ama buton yoktur. Lider başlatınca, fotoğraf yükleyince ve görevi tamamlayınca ekranları 15 saniye içinde kendiliğinden güncellenir.

## Yönetici paneli
- **Canlı:** harita (noktalar + takımların GPS konumu; GPS yoksa bulunduğu/gittiği nokta, kesikli çerçeveyle), 10 takım kartı (durum, kalan süre/gecikme, ilerleme, artefakt, puan, son hareket), **olay akışı** (kim ne zaman başladı, hangi noktaya vardı + fotoğrafı, hangi görevi tamamladı).
- **Geri al:** Lider yanlışlıkla «Görev tamamlandı»ya (veya varış fotoğrafına, «Sarnıca vardık»a) bastıysa takım detayındaki **Geri al** son işareti siler; liderin telefonu 20 sn içinde güncellenir.
- Takım kartına basınca **detay**: her nokta için plan / varış / bitiş saatleri, yol ve görev süreleri (aşanlar kırmızı), fotoğraflar (basınca büyük hali), **★ artefakt** düzeltme ve **puan** girişi, bonus fotoğrafları, **Takımı sıfırla**.
- **Sıralama:** artefakt → puan → bitiş süresi.
- **Linkler:** ortak link + 10 lider linki, QR kodlarıyla; **🖨 Yazdır** ile 1. sayfa ortak link, sonraki sayfalar lider kartları.
- **Ayarlar:** nokta konumlarını düzeltme (aşağıya bakın), tüm verileri silme.

## Deneyim ve görünüm
- **Artefakt koleksiyonu:** Oyun ekranının üstünde 10 yuvalı şerit; her görevde biri altınla dolar. «Görev tamamlandı»ya basınca liderde ve takım üyelerinin telefonlarında «Artefakt kazanıldı» animasyonu açılır.
- **Sesli anlatım:** Efsane ve nokta hikâyeleri «Hikâyeyi dinle» ile telefonun kendi sesiyle okunur (RU/TR).
- **Lanet kaldırıldı ekranı:** Bitişte süre, artefakt, puan, fotoğraf kolajı ve paylaşılabilir **hatıra kartı** (1080×1350 görsel).
- **Uygulama gibi:** Telefonda «Ana ekrana ekle» ile simgesiyle tam ekran açılır; sayfa önbelleğe alındığı için çekimin zayıf olduğu yerlerde (sarnıç) de açılır.
- **Paylaşım önizlemesi:** Link WhatsApp/Telegram'da kapak görseli ve başlıkla görünür (`medya/og.jpg`).
- İkonlar emoji yerine altın çizgi ikon seti (`ikonlar.js`); yazı tipleri depoda (`vendor/fonts`).

## Final ekranı (`ekran.html`)
Sarnıçtaki projeksiyon için: dizüstünü projektöre bağlayın → https://invibeglobalquest.github.io/ekran.html → PIN → **Gösterimi başlat** (tam ekran, sesli logo animasyonu; video yalnızca bu ekranda yüklenir, telefonları yavaşlatmaz). Ekranda canlı takım sıralaması, son fotoğrafların slayt gösterisi, olay şeridi ve her tamamlanan görevde büyük «artefakt kazandı» duyurusu çıkar. Yönetici panelinde **Linkler → Final ekranı** ile de açılır.

## Güvenli mod (önerilir)
Şu an lider kodları ve PIN `data.json` içinde, veritabanı da herkese açık. Güvenli modda kodları ve PIN'i Firebase kontrol eder; yalnızca o takımın lideri o takıma, yalnızca yönetici puanlara yazabilir; fotoğrafları da yalnızca uygulamayı açanlar görür.
1. Firebase konsolu → **Authentication → Get started → Sign-in method**: **Email/Password** ve **Anonymous**'u etkinleştirin.
2. **Proje ayarları (⚙) → Genel → Web API anahtarı**'nı kopyalayıp bana gönderin (`data.json → firebase_api_key`; bu anahtar gizli değildir).
3. Yönetici paneli → **Ayarlar → Güvenlik → «Güvenli modu kur»**: 10 lider ve 1 yönetici hesabı mevcut kod/PIN ile oluşturulur, kodlar korumalı alana yazılır ve kurallar gösterilir.
4. Gösterilen kuralları Firebase → Realtime Database → **Kurallar**'a yapıştırıp **Publish**.
5. Bana haber verin: `data.json`'da `guvenli: true` yapıp PIN'i ve kodları dosyadan silerim. Yazdırılmış QR'lar aynen çalışmaya devam eder.

Güvenli moddan sonra bir lider kodunu veya PIN'i değiştirmek için Firebase → Authentication'da ilgili hesabın şifresi de değişmelidir (bana yazın).

## Kurulum (bir kez)

### 1. Ortak veritabanı (Firebase, ücretsiz) — ✅ kuruldu (`questistanbul`)
1. https://console.firebase.google.com → proje oluşturun (Analytics gerekmez).
2. **Build → Realtime Database → Create Database** (konum: Europe, mod: test).
3. **Rules** sekmesine yapıştırıp **Publish**:
   ```json
   { "rules": { ".read": true, ".write": true } }
   ```
4. Veritabanı adresini (`https://xxxx-default-rtdb.europe-west1.firebasedatabase.app`) kopyalayıp `data.json` içinde `"senkron_url"` alanına yazın.

Adres boşsa site yine açılır ama her telefon yalnızca kendini görür (yalnızca deneme için).

### 2. Yayınlama (GitHub Pages) — ✅ `https://invibeglobalquest.github.io/`
Depo → **Settings → Pages → Deploy from a branch → main / (root)**. `main`'e giren her değişiklik 1–2 dk içinde siteye yansır.

## Etkinlik öncesi kontrol listesi
- [ ] **PIN'i değiştirin:** `data.json` → `"yonetici_pin"` (şu an `1453`).
- [ ] **Konumları doğrulayın.** Haritada kesikli çerçeveli iki nokta internette bulunamadığı için yaklaşık girildi:
  - «Последний пир» — **Palude restoranı** (şimdilik Atmeydanı civarı)
  - «Игра хозяйки» — **Sarnıç veya Kapadokya Kafe** (şimdilik Sarnıç)
  
  Diğer noktalar da (dondurmacı, simitçi, baharatçı, çantacı, çarşı) tahmini: gerçek dükkânlar farklı olabilir.
  **Düzeltme:** Yönetici paneli → **Ayarlar** → noktanın yanında durup **📍 Bulunduğum yer** → **Kaydet**; ya da koordinat / Google Maps bağlantısı yapıştırın; ya da "Noktaları haritada sürükle"yi açıp işareti taşıyın. Takımlar yeni konumu otomatik alır.
- [ ] **Linkler** sekmesinden QR kodlarını yazdırın; her lidere yalnızca kendi kartını verin. Ortak linki herkese gönderin.
- [ ] Bir telefonla bir takımı baştan sona deneyin, sonra panelden **Takımı sıfırla** (veya Ayarlar → tüm verileri sil).
- [ ] Takım liderlerine söyleyin: sayfayı açık tutun, istendiğinde **konum izni** verin, lider linkini kimseyle paylaşmayın.

## Dosyalar
| Dosya | Görev |
|---|---|
| `index.html`, `app.js` | Takım ekranı |
| `yonetici.html`, `yonetici.js` | Yönetici paneli |
| `common.js` | Ortak kod: metinler (RU/TR), sunucu, sayaç hesabı, fotoğraf küçültme |
| `style.css` | Tasarım |
| `data.json` | **Düzenlenecek dosya:** noktalar (metinler RU/TR, koordinat, artefakt), rotalar, süreler, PIN, veritabanı adresi |
| `ekran.html`, `ekran.js`, `ekran.css` | Final projeksiyon ekranı |
| `ikonlar.js`, `medya/`, `manifest.webmanifest`, `sw.js` | İkonlar, logo/video/görseller, uygulama bilgisi, çevrimdışı önbellek |
| `vendor/leaflet/` | Harita kütüphanesi (Leaflet 1.9.4, BSD lisansı) |
| `vendor/qrcode/` | QR kod üretici (qrcode-generator 1.4.4, MIT lisansı) |
| `vendor/fonts/` | Baskı yazı tipleri: Nunito, Cormorant Garamond, Noto Sans Egyptian Hieroglyphs (Fontsource, OFL-1.1) |
| `baski.html`, `baski.js`, `baski.css`, `materyal.json` | Baskı paketi |

### Lider kodları
`data.json → lider_kodlari`: her takımın 6 haneli kodu. Kod değişirse o takımın eski lider linki/QR'ı çalışmaz; yeni kartı yazdırın.

### Rotalar
`data.json → rotalar`: 10 takımın her biri aynı yürüyüş halkasını **farklı noktadan** başlar (Takım 1 amfitiyatrodan, Takım 2 Gülhane'den…). Böylece aynı anda iki takım aynı noktada olmaz. Sırayı değiştirmek için listeleri düzenleyin (istasyon anahtarlarıyla).

## Sınırlar (bilmeniz gerekenler)
- Lider kodları ve PIN `data.json`'da açık yazılı (karışıklığı önler, kötü niyete karşı koruma değildir). Veritabanı kuralları da herkese açık: meraklı biri teknik olarak verileri görebilir/değiştirebilir. Etkinlik sonrası Firebase'de kuralları `false` yapın veya projeyi silin.
- GPS konumu yalnızca takım sayfası telefonda **açıkken** gönderilir (ekran kilitlenince durur).
- Ücretsiz Firebase planı aynı anda 100 bağlantıya izin verir. İzleme ekranları sürekli bağlı kalmaz (15 sn'de bir kısa sorgu), bu yüzden 100+ katılımcı sorun olmaz.
- Fotoğraflar telefonda küçültülür (≈150–250 KB); 10 takım × ~15 fotoğraf ücretsiz kotanın çok altında kalır.
- Harita altlığı OpenStreetMap'ten gelir (internet gerekir).
