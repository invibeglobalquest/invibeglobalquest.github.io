# Проклятье 1001 колонны · 1001 Direğin Laneti — Quest sitesi

10 takımlık Sultanahmet quest'i için telefonda çalışan web sitesi. **Tek bağlantı** herkese gönderilir:

- **Takım liderleri** takımını seçer, kendi rotasında 10 noktayı sırayla gezer.
- **Ana yönetici** aynı bağlantıda alttaki **🔒 Yönetici paneli**ne girer (PIN) ve tüm takımları canlı izler.

Site Rusça ve Türkçe çalışır (sağ üstteki RU / TR). Derleme gerekmez; HTML/CSS/JS ve `data.json`'dan oluşur.

## Takım ekranı nasıl işler?
1. Takım seçilir → efsane, rota (Başlangıç: Binbirdirek Sarnıcı → 10 nokta → Final: Sarnıç) ve kurallar görünür → **Questi başlat**.
2. Üstte büyük sayaç: her **yol en fazla 10 dk**, her **noktadaki görev en fazla 10 dk**. Süre aşılırsa sayaç kırmızıya döner ve `+02:15 gecikme` gösterir. Yanında toplam süre.
3. Sıradaki nokta kartında: **📍 Konuma git** (Google Maps yürüyüş yol tarifi), hikâye, görev maddeleri, koşul ve kazanılacak artefakt.
4. **Adım 1 — fotoğraf:** Noktaya varınca noktanın fotoğrafı yüklenir. Bu, varış kaydıdır ve görev sayacını başlatır (GPS açıksa noktaya uzaklık da kaydedilir).
5. **Adım 2 — ✅ Görev tamamlandı:** Saat kaydedilir (`Tamamlandı · 14:32`), sıradaki noktanın yol sayacı başlar. "Artefaktı aldık" kutusu da işaretlenir.
6. "Rotadaki tüm noktalar" listesinde her noktaya basınca konuma git + görev açılır; her noktanın **plan saat dilimi** (ör. `Plan 12:10–12:20`) ve gerçek saatleri görünür.
7. **Yol görevleri (bonus):** «Следы исчезнувшей хозяйки» (harita parçası), «Взгляд сверху», «Стражи квартала» — istenen an fotoğraf eklenir.
8. 10 nokta bitince final kartı: Sarnıç'a git → **🏁 Sarnıca vardık**.

İnternet kesilirse kayıtlar telefonda bekler ve bağlantı gelince otomatik gönderilir (üstte "gönderiliyor… (n)").
Telefon değişirse / tarayıcı kapanırsa aynı takım tekrar seçilir, "kaldığı yerden devam" denir.

## Yönetici paneli
- **Canlı:** harita (noktalar + takımların GPS konumu; GPS yoksa bulunduğu/gittiği nokta, kesikli çerçeveyle), 10 takım kartı (durum, kalan süre/gecikme, ilerleme, artefakt, puan, son hareket), **olay akışı** (kim ne zaman başladı, hangi noktaya vardı + fotoğrafı, hangi görevi tamamladı).
- Takım kartına basınca **detay**: her nokta için plan / varış / bitiş saatleri, yol ve görev süreleri (aşanlar kırmızı), fotoğraflar (basınca büyük hali), **★ artefakt** düzeltme ve **puan** girişi, bonus fotoğrafları, **Takımı sıfırla**.
- **Sıralama:** artefakt → puan → bitiş süresi.
- **Ayarlar:** nokta konumlarını düzeltme (aşağıya bakın), tüm verileri silme.

## Kurulum (bir kez)

### 1. Ortak veritabanı (Firebase, ücretsiz) — takımların yöneticiye görünmesi için şart
1. https://console.firebase.google.com → proje oluşturun (Analytics gerekmez).
2. **Build → Realtime Database → Create Database** (konum: Europe, mod: test).
3. **Rules** sekmesine yapıştırıp **Publish**:
   ```json
   { "rules": { ".read": true, ".write": true } }
   ```
4. Veritabanı adresini (`https://xxxx-default-rtdb.europe-west1.firebasedatabase.app`) kopyalayıp `data.json` içinde `"senkron_url"` alanına yazın.

Adres boşsa site yine açılır ama her telefon yalnızca kendini görür (yalnızca deneme için).

### 2. Yayınlama (GitHub Pages)
1. Bu dalı **main**'e birleştirin.
2. Depo → **Settings → Pages → Deploy from a branch → main / (root) → Save**.
3. 1–2 dk sonra adres: `https://KULLANICI-ADI.github.io/Okay-depo/` → bunu (veya QR kodunu) katılımcılara gönderin.

## Etkinlik öncesi kontrol listesi
- [ ] **PIN'i değiştirin:** `data.json` → `"yonetici_pin"` (varsayılan `1001`).
- [ ] **Konumları doğrulayın.** Haritada kesikli çerçeveli iki nokta internette bulunamadığı için yaklaşık girildi:
  - «Последний пир» — **Palude restoranı** (şimdilik Atmeydanı civarı)
  - «Игра хозяйки» — **Sarnıç veya Kapadokya Kafe** (şimdilik Sarnıç)
  
  Diğer noktalar da (dondurmacı, simitçi, baharatçı, çantacı, çarşı) tahmini: gerçek dükkânlar farklı olabilir.
  **Düzeltme:** Yönetici paneli → **Ayarlar** → noktanın yanında durup **📍 Bulunduğum yer** → **Kaydet**; ya da koordinat / Google Maps bağlantısı yapıştırın; ya da "Noktaları haritada sürükle"yi açıp işareti taşıyın. Takımlar yeni konumu otomatik alır.
- [ ] Bir telefonla bir takımı baştan sona deneyin, sonra panelden **Takımı sıfırla** (veya Ayarlar → tüm verileri sil).
- [ ] Takım liderlerine söyleyin: sayfayı açık tutun, istendiğinde **konum izni** verin.

## Dosyalar
| Dosya | Görev |
|---|---|
| `index.html`, `app.js` | Takım ekranı |
| `yonetici.html`, `yonetici.js` | Yönetici paneli |
| `common.js` | Ortak kod: metinler (RU/TR), sunucu, sayaç hesabı, fotoğraf küçültme |
| `style.css` | Tasarım |
| `data.json` | **Düzenlenecek dosya:** noktalar (metinler RU/TR, koordinat, artefakt), rotalar, süreler, PIN, veritabanı adresi |
| `vendor/leaflet/` | Harita kütüphanesi (Leaflet 1.9.4, BSD lisansı) |

### Rotalar
`data.json → rotalar`: 10 takımın her biri aynı yürüyüş halkasını **farklı noktadan** başlar (Takım 1 amfitiyatrodan, Takım 2 Gülhane'den…). Böylece aynı anda iki takım aynı noktada olmaz. Sırayı değiştirmek için listeleri düzenleyin (istasyon anahtarlarıyla).

## Sınırlar (bilmeniz gerekenler)
- Veritabanı kuralları herkese açık ve PIN `data.json`'da açık yazılı: meraklı biri teknik olarak verileri görebilir/değiştirebilir. Etkinlik sonrası Firebase'de kuralları `false` yapın veya projeyi silin.
- GPS konumu yalnızca takım sayfası telefonda **açıkken** gönderilir (ekran kilitlenince durur).
- Fotoğraflar telefonda küçültülür (≈150–250 KB); 10 takım × ~15 fotoğraf ücretsiz kotanın çok altında kalır.
- Harita altlığı OpenStreetMap'ten gelir (internet gerekir).
