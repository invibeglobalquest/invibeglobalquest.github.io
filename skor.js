async function ortakVeri() {
  const u = senkronUrl();
  if (u) {
    const j = await uzakOku("/takimlar");
    if (j !== undefined) return { veri: j || {}, ortak: true };
  }
  // Ortak adres yok / ulaşılamıyor: yalnızca bu telefondaki veriler
  const d = durumOku(), v = {};
  Object.keys(VERI.rotalar).forEach((t) => {
    const p = yerelPuanOku(t), k = {};
    if (Object.keys(p).length) k.puan = toplamPuan(p);
    if (d.takim === t) {
      k.tamamlanan = d.tamamlanan.length;
      k.son = d.tamamlanan.length ? d.tamamlanan.at(-1).ts : null;
      k.baslangic = d.baslangic;
    }
    if (Object.keys(k).length) v[t] = k;
  });
  return { veri: v, ortak: false };
}

async function ciz() {
  const { veri, ortak } = await ortakVeri();
  const uy = document.getElementById("uyari");
  if (!ortak) {
    uy.classList.remove("gizli");
    uy.textContent = senkronUrl()
      ? "Ortak veritabanına ulaşılamadı; yalnızca bu telefondaki veriler gösteriliyor."
      : "Ortak veritabanı ayarlanmamış (data.json → senkron_url). Tablo yalnızca bu telefondaki verileri gösteriyor.";
  } else uy.classList.add("gizli");

  const satirlar = Object.keys(VERI.rotalar).map((id) => {
    const k = veri[id] || {};
    return { id, t: k.tamamlanan || 0, puan: k.puan || 0, son: k.son || Infinity, basladi: !!k.baslangic, toplam: VERI.rotalar[id].length };
  });
  satirlar.sort((a, b) => b.puan - a.puan || b.t - a.t || a.son - b.son || a.id - b.id);

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
      '<div class="bar"><i style="width:' + (100 * s.t / s.toplam) + '%"></i></div></td>' +
      '<td class="n">' + s.puan + "</td>";
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
