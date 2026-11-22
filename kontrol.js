const $ = (id) => document.getElementById(id);
let takim = null;

function oturumAc(t) { try { sessionStorage.setItem("quest_kontrol", t); } catch (e) {} }
function oturumOku() { try { return sessionStorage.getItem("quest_kontrol"); } catch (e) { return null; } }

function toplamGuncelle() {
  const p = { ek: $("ek").value, istasyon: {} };
  document.querySelectorAll("[data-ist]").forEach((i) => (p.istasyon[i.dataset.ist] = i.value));
  $("toplam").textContent = toplamPuan(p);
  return p;
}

async function panelAc(t) {
  takim = t;
  oturumAc(t);
  $("giris").classList.add("gizli");
  $("panel").classList.remove("gizli");
  $("panelBaslik").textContent = "Takım " + t;

  const uzak = (await uzakOku("/takimlar/" + t)) || {};
  const yerel = yerelPuanOku(t);
  const kayitli = uzak.puanlar ? { istasyon: uzak.puanlar, ek: uzak.ekpuan } : yerel;
  const d = durumOku();
  const tam = senkronUrl() ? (uzak.tamamlanan || 0) : (d.takim === t ? d.tamamlanan.length : 0);
  $("panelDurum").textContent = tam + " / " + VERI.rotalar[t].length + " nokta tamamlandı";

  const kutu = $("satirlar");
  kutu.innerHTML = "";
  for (const [i, id] of VERI.rotalar[t].entries()) {
    const ist = VERI.istasyonlar[id];
    if (!ist.puan) continue;
    const div = document.createElement("div");
    div.className = "kart";
    const bitti = i < tam;
    let ic = "<b>" + (i + 1) + ". " + ist.ad + "</b><div class='soluk'>" + (bitti ? "✅ Tamamlandı" : "⏳ Henüz tamamlanmadı") + "</div>";
    if (ist.tip === "foto") {
      let foto = null;
      const f = await uzakOku("/fotolar/" + t + "/" + id);
      if (f && f.foto) foto = f.foto;
      else { try { foto = localStorage.getItem(yerelFotoAnahtar(t, id)); } catch (e) {} }
      ic += foto ? '<img class="onizleme" alt="Yüklenen fotoğraf" src="' + foto + '">' : '<div class="soluk">Fotoğraf henüz yüklenmedi.</div>';
    }
    const v = (kayitli.istasyon || {})[id];
    ic += '<div class="alan"><label>Puan (0–' + ist.puan + ")</label>" +
      '<input type="number" inputmode="numeric" min="0" max="' + ist.puan + '" step="1" data-ist="' + id + '" value="' + (v === undefined ? "" : v) + '"></div>';
    div.innerHTML = ic;
    kutu.appendChild(div);
  }
  $("ek").value = Number(kayitli.ek) || 0;
  document.querySelectorAll("[data-ist]").forEach((i) => i.addEventListener("input", toplamGuncelle));
  $("ek").oninput = toplamGuncelle;
  toplamGuncelle();
}

async function kaydet() {
  const p = toplamGuncelle();
  // 0–max aralığına sıkıştır
  for (const id of Object.keys(p.istasyon)) {
    const max = VERI.istasyonlar[id].puan;
    let n = Number(p.istasyon[id]);
    if (p.istasyon[id] === "" || isNaN(n)) { delete p.istasyon[id]; continue; }
    p.istasyon[id] = Math.min(max, Math.max(0, Math.round(n)));
  }
  p.ek = Math.round(Number(p.ek) || 0);
  const toplam = toplamPuan(p);
  yerelPuanYaz(takim, p);
  let mesaj = "✅ Kaydedildi. Toplam: " + toplam;
  $("kayitHata").style.color = "var(--yesil)";
  if (senkronUrl()) {
    const ok = await uzakYama("/takimlar/" + takim, { puanlar: p.istasyon, ekpuan: p.ek, puan: toplam });
    if (!ok) { mesaj = "❌ Ortak veritabanına gönderilemedi. İnterneti kontrol edip tekrar kaydedin."; $("kayitHata").style.color = ""; }
  } else mesaj += " (yalnızca bu telefonda; ortak veritabanı ayarlı değil)";
  $("kayitHata").textContent = mesaj;
  document.querySelectorAll("[data-ist]").forEach((i) => { if (p.istasyon[i.dataset.ist] !== undefined) i.value = p.istasyon[i.dataset.ist]; });
  $("toplam").textContent = toplam;
}

function pinDene() {
  const t = $("takimSec").value;
  const dogru = (VERI.kontrolcu_sifreleri || {})[t];
  if (!dogru || normalize($("pin").value) !== normalize(dogru)) {
    $("pinHata").textContent = "❌ Yanlış kontrolcü şifresi.";
    return;
  }
  $("pinHata").textContent = "";
  panelAc(t);
}

(async function () {
  await veriYukle();
  if (!senkronUrl()) {
    $("uyari").classList.remove("gizli");
    $("uyari").textContent = "Ortak veritabanı ayarlı değil (data.json → senkron_url). Puanlar yalnızca bu telefonda kalır ve diğer telefonlardaki puan tablosunda görünmez.";
  }
  const s = $("takimSec");
  Object.keys(VERI.rotalar).forEach((n) => { const o = document.createElement("option"); o.value = n; o.textContent = "Takım " + n; s.appendChild(o); });
  const d = durumOku();
  if (d.takim) s.value = d.takim;
  $("pinDugme").onclick = pinDene;
  $("pin").addEventListener("keydown", (e) => { if (e.key === "Enter") pinDene(); });
  $("kaydet").onclick = kaydet;
  $("cikis").onclick = () => { try { sessionStorage.removeItem("quest_kontrol"); } catch (e) {} location.reload(); };
  const o = oturumOku();
  if (o && VERI.rotalar[o]) panelAc(o);
})();
