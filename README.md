# Tarihi Yarımada Quest

10 takımlı şehir quest'i için telefonda çalışan Türkçe web sitesi. Sadece HTML/CSS/JS; sunucu gerekmez.

## Sayfalar
| Sayfa | Kim kullanır | Ne yapar |
|---|---|---|
| `index.html` | Takımlar | Takım seçimi, 150 dk sayaç, sıradaki nokta, konum butonu, şifre/fotoğraf girişi |
| `kontrol.html` | Takım kontrolcüsü | Takım + kontrolcü şifresiyle girer; istasyon puanı, ek puan/ceza, toplam puan, yüklenen fotoğrafları görme |
| `skor.html` | Herkes | Tüm takımların şu anki noktası, biten sayısı ve puanı |

## Noktalar ve rotalar
- 10 nokta: **Binbirdirek Sarnıcı** + 9 istasyon (Tiyatro Meydanı, Dondurmacı, Dikilitaş, Çantacı, Mezarlık, Simitçi, Kapalı Çarşı, Akustik Oda, Valide Han).
- `data.json` içindeki `halka` sırası yürüyüş sırasıdır. Her takım halkada farklı bir noktadan başlayıp halkayı bir tur dolaşır (Takım 1: Binbirdirek'ten, Takım 2: Tiyatro Meydanı'ndan …). Böylece **her turda 10 takım 10 farklı noktada** olur.
- Çakışmasızlık, takımların **aynı anda başlaması** ve her turu `tur_dakika` içinde bitirmesi şartına bağlıdır. Ekranda her nokta için hedef ayrılış saati görünür.
- Binbirdirek hem başlangıç/bitiş hem de bir mola noktasıdır; rotanın başında, ortasında veya sonunda çıkabilir.

## Görev türleri (`tip`)
| tip | Davranış |
|---|---|
| `kod` | Yetkilinin verdiği şifre girilir |
| `sifre` | Mezarlıkta bulunan şifre kelime girilir |
| `foto` | Takım fotoğraf çekip yükler |
| `serbest` | Şifresiz, "Tamam, devam et" butonu (Binbirdirek) |

Şifre karşılaştırması büyük/küçük harf, Türkçe karakter ve boşluğa duyarsızdır (`ÇANTA` = `canta`).

## data.json'u düzenleme
- `istasyonlar`: `ad`, `tip`, `konum` (Google Maps bağlantısı), `gorev` (açıklama), `kod` (şifre), `puan` (kontrolcünün verebileceği en yüksek puan).
- Konum için Maps'te yeri açın → **Paylaş → Bağlantıyı kopyala** → `"konum"` alanına yapıştırın. Doluysa **📍 Konuma git** butonu çıkar.
- `rotalar`: her takımın sırası. `halka`'yı değiştirirseniz rotaları da aynı kuralla yeniden oluşturmanız gerekir (rota = halkanın takım numarasına göre kaydırılmış hali).
- `kontrolcu_sifreleri`: her takımın kontrolcü şifresi.
- `etkinlik`: `sure_dakika` (toplam süre), `tur_dakika` (her nokta için ayrılan süre; 10 tur × 14 = 140 dk), `istasyon_max_dakika`.

> ⚠️ Şifreler ve kontrolcü şifreleri `data.json` içinde açık yazılıdır; dosyayı açan biri görebilir. Gizlilik gerekiyorsa sunucu gerekir.
> ⚠️ Örnek şifreleri (ve `KELIME`) etkinlikten önce mutlaka değiştirin.

## GitHub Pages'te yayınlama
1. Dosyaları `main` dalına alın (PR'ı birleştirin).
2. **Settings → Pages → Source: Deploy from a branch → main → / (root) → Save**
3. Adres: `https://KULLANICI-ADI.github.io/Okay-depo/`

## Ortak veritabanı (puan tablosu, puanlar ve fotoğraflar için gerekli)
Sunucusuz sitede her telefon yalnızca kendi verisini bilir. Takımların ilerlemesi, kontrolcü puanları ve fotoğrafların başka telefonlarda görünmesi için ücretsiz Firebase Realtime Database kullanılır:

1. https://console.firebase.google.com → proje oluşturun.
2. **Build → Realtime Database → Create Database**.
3. **Rules** sekmesine yapıştırıp **Publish** edin (etkinlik süresince herkese açık; sonra kapatın):
   ```json
   { "rules": { ".read": true, ".write": true } }
   ```
4. Veritabanı adresini (`https://....firebasedatabase.app`) `data.json` → `etkinlik.senkron_url` alanına yazın.

Adres boşsa site çalışır ama: tablo yalnızca bu telefondaki veriyi gösterir, fotoğraf yalnızca çekildiği telefonda kalır, puanlar yalnızca girildiği telefonda görünür.
Kurallar herkese açık olduğundan puanlar teorik olarak dışarıdan değiştirilebilir.

## Sıfırlama
- Telefonlarda: "Takımı değiştir" veya tarayıcı site verilerini silin.
- Ortak veritabanında: Firebase konsolunda `takimlar` ve `fotolar` düğümlerini silin.
