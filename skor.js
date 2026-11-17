async function ortakVeri() {
  const u = senkronUrl();
  if (u) {
    try {
      const r = await fetch(u + "/takimlar.json?t=" + Date.now());
      const j = await r.json();
      return { veri: j || {}, ortak: true };
    } catch (e) { /* ağ yoksa yerel veriye düş */ }
  }
  // Ortak adres yok: yalnızca bu telefondaki takım
  const d = durumOku(), v = {};
  if (d.takim) v[d.takim] = { tamamlanan: d.tamamlanan.length, son: d.tamamlanan.length ? d.tamamlanan.at(-1).ts : null, baslangic: d.baslangic };
  return { veri: v, ortak: false };
}

async function ciz() {
  const { veri, ortak } = await ortakVeri();
  const uy = document.getElementById("uyari");
  if (!ortak) {
    uy.classList.remove("gizli");
    uy.textContent = senkronUrl()
      ? "Ortak veritabanına ulaşılamadı; yalnızca bu telefondaki veriler gösteriliyor."
      : "Ortak veritabanı ayarlanmamış (data.json → senkron_url). Tablo yalnızca bu telefondaki takımı gösteriyor.";
  } else uy.classList.add("gizli");

  const toplam = (id) => VERI.rotalar[id].length;
  const satirlar = Object.keys(VERI.rotalar).map((id) => {
    const k = veri[id] || {};
    const t = k.tamamlanan || 0;
    return { id, t, son: k.son || Infinity, basladi: !!k.baslangic, toplam: toplam(id) };
  });
  satirlar.sort((a, b) => b.t - a.t || a.son - b.son || a.id - b.id);

  const g = document.getElementById("govde");
  g.innerHTML = "";
  satirlar.forEach((s, i) => {
    let su;
    if (!s.basladi) su = "Başlamadı";
    else if (s.t >= s.toplam) su = "🏁 Bitirdi";
    else su = VERI.istasyonlar[VERI.rotalar[s.id][s.t]].ad;
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + (i + 1) + "</td><td><b>Takım " + s.id + "</b></td><td>" + su +
      '</td><td class="n">' + s.t + "/" + s.toplam +
      '<div class="bar"><i style="width:' + (100 * s.t / s.toplam) + '%"></i></div></td>';
    g.appendChild(tr);
  });
  document.getElementById("guncel").textContent =
    "Son güncelleme: " + new Date().toLocaleTimeString("tr-TR") + " · 10 sn'de bir yenilenir";
}

(async function () {
  await veriYukle();
  await ciz();
  setInterval(ciz, 10000);
})();
