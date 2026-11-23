// Çizgi ikon seti (24×24, stroke = currentColor) ve kemer motifi
"use strict";

const IKON = {
  // noktalar
  amfi: '<path d="M3 19h18"/><path d="M5 19a7 7 0 0 1 14 0"/><path d="M8.5 19a3.5 3.5 0 0 1 7 0"/><path d="M12 9V5"/>',
  gulhane: '<path d="M12 21v-6"/><path d="M12 15c-4 0-7-2.5-7-6a7 7 0 0 1 14 0c0 3.5-3 6-7 6z"/><path d="M9 21h6"/>',
  dondurma: '<path d="M8 11l4 10 4-10"/><path d="M7 11a5 5 0 0 1 10 0z"/><path d="M12 6V4"/>',
  simit: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M8.2 7.4l.4.4M15.6 7.6l-.4.4M7.2 14.8l.5-.3M16.4 16.2l.4.4M12 4.9v.7M17.6 12.6h.7"/>',
  baharat: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M14 11l5-7"/><path d="M8 21h8"/>',
  canta: '<path d="M5 9h14l-1 11H6z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>',
  pazar: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.5"/>',
  dikilitas: '<path d="M10 20l1-14 1-2 1 2 1 14z"/><path d="M7 20h10"/><path d="M11.4 9h1.2M11.2 13h1.6"/>',
  ziyafet: '<circle cx="12" cy="13" r="6"/><circle cx="12" cy="13" r="2.8"/><path d="M3 4v5a1.5 1.5 0 0 0 3 0V4M4.5 10v10"/><path d="M21 4c-1.5 1-2 3-2 6h2v10"/>',
  oyun: '<path d="M7 3h10M7 21h10"/><path d="M8 3c0 5 8 5 8 9s-8 4-8 9"/><path d="M16 3c0 5-8 5-8 9s8 4 8 9"/>',
  sarnic: '<path d="M5 21V11a7 7 0 0 1 14 0v10"/><path d="M9 21v-9a3 3 0 0 1 6 0v9"/><path d="M3 21h18"/>',
  // yol görevleri
  iz: '<path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  kubbe: '<path d="M6 20v-6a6 6 0 0 1 12 0v6"/><path d="M12 8V5"/><path d="M3 20V10M21 20V10"/><path d="M2 20h20"/>',
  kedi: '<path d="M5 20V9l3-4 2 3h4l2-3 3 4v11z"/><path d="M9.5 13h.01M14.5 13h.01"/><path d="M11 16h2"/>',
  // arayüz
  konum: '<path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  foto: '<path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  tamam: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>',
  yildiz: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  goz: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  kilit: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  saat: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  ses: '<path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  dur: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  ok: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  bayrak: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  paylas: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v7h14v-7"/>',
  indir: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  ekran: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  baslat: '<path d="M8 5l11 7-11 7z"/>',
  kalkan: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>'
};

function ikon(ad, sinif) {
  const p = IKON[ad];
  if (!p) return "";
  return '<svg class="ik' + (sinif ? " " + sinif : "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + p + "</svg>";
}
// Nokta ikonu; ikon yoksa data.json'daki emoji
function noktaIkon(id, sinif) {
  if (IKON[id]) return ikon(id, sinif);
  const n = (typeof VERI !== "undefined" && VERI) ? (VERI.istasyonlar[id] || VERI.yol_gorevleri[id]) : null;
  return n && n.emoji ? '<span class="ik-emoji">' + n.emoji + "</span>" : "";
}
// Sunumdaki iç içe kemerler
function kemerSVG(sinif) {
  return '<svg class="kemer' + (sinif ? " " + sinif : "") + '" viewBox="0 0 200 300" aria-hidden="true" focusable="false">' +
    '<path d="M8 300V104a92 92 0 0 1 184 0v196"/><path d="M24 300V104a76 76 0 0 1 152 0v196"/><path d="M40 300V104a60 60 0 0 1 120 0v196"/></svg>';
}
