/* ============================================================
   EJAVEC 2026 — mesin simulasi, peta ubin, dan narasi otomatis
   Model Leontief bersifat linier: menskalakan besaran guncangan
   terhadap hasil dasar notebook sah secara matematis.
   ============================================================ */
'use strict';

const OUTPUT_TOTAL = 1945328;      // total output IO-AKI Jawa Timur (miliar Rp)

/* Basis guncangan sesuai notebook. 'basis' = nilai yang menghasilkan kolom g[i]. */
const KANAL = [
  {id:'g1', i:0, nama:'Kekeringan El Ni\u00f1o', basis:15, min:0, max:30, step:1,
   satuan:'%', ket:'Penurunan output pertanian di sepuluh kabupaten produsen utama.'},
  {id:'g2', i:1, nama:'Banjir La Ni\u00f1a', basis:20, min:0, max:40, step:1,
   satuan:'%', ket:'Penurunan output pertanian pesisir utara, disertai gangguan transportasi.'},
  {id:'g3', i:2, nama:'Kenaikan harga pupuk', basis:30, min:0, max:60, step:1,
   satuan:'%', ket:'Ditransmisikan ke output pertanian melalui elastisitas biaya input.'},
  {id:'g4', i:3, nama:'Gangguan rantai pasok', basis:100, min:0, max:200, step:5,
   satuan:'% intensitas', ket:'Nilai 100 setara asumsi paper: perdagangan \u22125% dan transportasi \u221210%.'},
  {id:'g5', i:4, nama:'Serangan wereng coklat', basis:10, min:0, max:25, step:1,
   satuan:'%', ket:'Penurunan output pertanian akibat organisme pengganggu tanaman.'}
];

const KEBIJAKAN = [
  {i:0, kode:'S1', nama:'Hilirisasi pangan terintegrasi'},
  {i:1, kode:'S2', nama:'Modernisasi infrastruktur irigasi'},
  {i:2, kode:'S3', nama:'Cold chain & logistics hub'},
  {i:3, kode:'S4', nama:'Buffer stock strategis'},
  {i:4, kode:'S6', nama:'Digitalisasi pertanian'}
];

const RAMP = ['--d0','--d1','--d2','--d3','--d4'];
const state = {kanal:{}, aktif:{}};
KANAL.forEach(k => state.kanal[k.id] = 0);
state.kanal.g3 = 30;   // guncangan yang terealisasi sepanjang 2026
KEBIJAKAN.forEach(p => state.aktif[p.kode] = false);

/* ---------------- utilitas ---------------- */
const el = s => document.querySelector(s);
const fmt = (n,d=0) => n.toLocaleString('id-ID',{minimumFractionDigits:d, maximumFractionDigits:d});
const rp  = n => (n<0?'\u2212':'') + 'Rp' + fmt(Math.abs(n));
const triliun = n => (n<0?'\u2212':'') + 'Rp' + fmt(Math.abs(n)/1000,1) + ' T';
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* ---------------- perhitungan ---------------- */
function hitung(){
  const fak = KANAL.map(k => state.kanal[k.id] / k.basis);
  const aktifIdx = KEBIJAKAN.filter(p => state.aktif[p.kode]).map(p => p.i);

  let guncangTotal = 0, kebijakanTotal = 0;
  const kanalTotal = [0,0,0,0,0];

  const hasil = WILAYAH.map(w => {
    let guncang = 0;
    for (let i=0;i<5;i++){
      const v = (w.g[i]||0) * fak[i];
      guncang += v; kanalTotal[i] += v;
    }
    let manfaat = 0;
    aktifIdx.forEach(i => manfaat += (w.s[i]||0));
    guncangTotal += guncang; kebijakanTotal += manfaat;
    return {w, guncang, manfaat, bersih: guncang + manfaat};
  });

  return {hasil, guncangTotal, kebijakanTotal, bersihTotal: guncangTotal + kebijakanTotal,
          kanalTotal, aktifIdx};
}

/* ---------------- papan angka ---------------- */
function renderPapan(h){
  const pctBersih = h.bersihTotal / OUTPUT_TOTAL * 100;
  const pctGuncang = h.guncangTotal / OUTPUT_TOTAL * 100;
  const terdampak = h.hasil.filter(r => r.bersih < 0).length;
  const peredam = h.guncangTotal !== 0
      ? Math.min(100, Math.abs(h.kebijakanTotal / h.guncangTotal) * 100) : 0;

  el('#papan').innerHTML = `
    <div class="angka">
      <div class="angka-label">Dampak bersih</div>
      <div class="angka-nilai ${h.bersihTotal<0?'neg':'pos'}">${triliun(h.bersihTotal)}</div>
      <div class="angka-ket">${fmt(Math.abs(pctBersih),2)}% dari total output provinsi</div>
    </div>
    <div class="angka">
      <div class="angka-label">Kerugian guncangan</div>
      <div class="angka-nilai neg">${triliun(h.guncangTotal)}</div>
      <div class="angka-ket">setara ${fmt(Math.abs(pctGuncang),2)}% sebelum kebijakan</div>
    </div>
    <div class="angka">
      <div class="angka-label">Manfaat kebijakan</div>
      <div class="angka-nilai ${h.kebijakanTotal>0?'pos':''}">${h.kebijakanTotal>0?triliun(h.kebijakanTotal):'\u2014'}</div>
      <div class="angka-ket">${h.aktifIdx.length? 'meredam '+fmt(peredam,0)+'% kerugian' : 'belum ada kebijakan aktif'}</div>
    </div>
    <div class="angka">
      <div class="angka-label">Wilayah merugi</div>
      <div class="angka-nilai">${terdampak}<span style="font-size:.5em;color:var(--tinta-3)"> / 38</span></div>
      <div class="angka-ket">masih mencatat dampak bersih negatif</div>
    </div>`;
}

/* ---------------- peta ubin ---------------- */
function warna(nilai, maxAbs){
  if (nilai > 0) return css('--positif-ok');
  const r = Math.abs(nilai) / (maxAbs || 1);
  const idx = r < .08 ? 0 : r < .25 ? 1 : r < .5 ? 2 : r < .78 ? 3 : 4;
  return css(RAMP[idx]);
}

function renderPeta(h){
  const maxAbs = Math.max(...h.hasil.map(r => Math.abs(r.bersih)), 1);
  el('#peta').innerHTML = h.hasil.map(r => {
    const w = r.w;
    const baris = w.r === 1 ? 1 : w.r + 1;     // baris 2 = selat, dikosongkan
    const c = warna(r.bersih, maxAbs);
    const terang = r.bersih > 0 || Math.abs(r.bersih)/maxAbs > .45;
    return `<div class="ubin${w.kota?' kota':''}" tabindex="0"
      style="grid-row:${baris};grid-column:${w.c};background:${c};color:${terang?'#F7F8F4':'#12292C'}"
      data-n="${w.nama}" data-b="${r.bersih.toFixed(1)}" data-g="${r.guncang.toFixed(1)}"
      data-m="${r.manfaat.toFixed(1)}" data-f="${w.fsi}" data-mu="${w.mult}"
      data-p="${w.pdrb25}" data-w="${w.warn}"><span>${w.sn}</span></div>`;
  }).join('');

  const label = ['dampak terkecil','ringan','sedang','berat','terberat'];
  el('#peta-ket').innerHTML =
    `<div class="ket-item"><span class="ket-kotak" style="background:${css('--positif-ok')}"></span>surplus bersih</div>` +
    RAMP.map((v,i)=>`<div class="ket-item"><span class="ket-kotak" style="background:${css(v)}"></span>${label[i]}</div>`).join('');
}

/* ---------------- tabel peringkat ---------------- */
function renderTabel(h){
  const urut = [...h.hasil].sort((a,b) => a.bersih - b.bersih).slice(0,10);
  const maxAbs = Math.abs(urut[0]?.bersih || 1);
  el('#tabel-peringkat tbody').innerHTML = urut.map((r,i) => {
    const w = r.w;
    const pct = w.pdrb25 ? Math.abs(r.bersih) / w.pdrb25 * 100 : 0;
    const lebar = Math.max(2, Math.abs(r.bersih)/maxAbs*100);
    const st = w.warn || '';
    const cw = st.startsWith('KUNING') ? css('--d2') : st.startsWith('MERAH') ? css('--d4')
             : st.startsWith('ORANYE') ? css('--d3') : css('--tinta-3');
    return `<tr>
      <td class="rank">${i+1}</td>
      <td>${w.nama}</td>
      <td class="num ${r.bersih<0?'neg':'pos'}">${rp(Math.round(r.bersih))} M</td>
      <td class="bar-sel"><span class="bar" style="width:${lebar}%;background:${warna(r.bersih,maxAbs)}"></span></td>
      <td class="num">${fmt(pct,2)}%</td>
      <td class="num">${fmt(w.mult,3)}</td>
      <td><span class="lencana" style="color:${cw}">${st.split(' ')[0]||'\u2014'}</span></td>
    </tr>`;
  }).join('');
}

/* ---------------- tabel kebijakan ---------------- */
function renderKebijakan(){
  const bcrMap = {}; META.bcr.forEach(b => bcrMap[b.k.slice(0,2)] = b);
  const maxP95 = Math.max(...META.bcr.map(b => b.p95 || 0), 1);
  const baris = META.kebijakan
    .filter(k => !k.k.startsWith('S5'))
    .sort((a,b) => b.bcr - a.bcr)
    .map(k => {
      const kode = k.k.slice(0,2), b = bcrMap[kode] || {};
      const kiri = (b.p5||0)/maxP95*100, kanan = (b.p95||0)/maxP95*100;
      const aktif = state.aktif[kode];
      return `<tr${aktif?' style="background:var(--panel-2)"':''}>
        <td>${aktif?'<b>':''}${k.k.replace(/^S\d:\s*/,'')}${aktif?'</b>':''}
            <span style="color:var(--tinta-3);font-family:'IBM Plex Mono',monospace;font-size:11px"> ${kode}</span></td>
        <td class="num pos">${rp(Math.round(k.gain))} M</td>
        <td class="num">${rp(k.cost)} M</td>
        <td class="num"><b>${fmt(b.npv8||0,2)}</b></td>
        <td class="bar-sel" title="P5 ${fmt(b.p5||0,2)} \u2013 P95 ${fmt(b.p95||0,2)}">
          <span style="display:block;height:9px;position:relative;background:var(--panel-2)">
            <span style="position:absolute;left:${kiri}%;width:${Math.max(2,kanan-kiri)}%;top:0;bottom:0;background:var(--aksen)"></span>
          </span></td>
        <td class="num">${fmt(k.cov,0)}%</td>
      </tr>`;
    }).join('');
  el('#tabel-kebijakan tbody').innerHTML = baris;
}

/* ---------------- narasi otomatis ---------------- */
function renderNarasi(h){
  const pct = Math.abs(h.bersihTotal / OUTPUT_TOTAL * 100);
  const urut = [...h.hasil].sort((a,b) => a.bersih - b.bersih);
  const tiga = urut.slice(0,3);
  const dom = KANAL.map((k,i) => ({k, v:Math.abs(h.kanalTotal[i])}))
                   .sort((a,b) => b.v - a.v)[0];
  const domPct = Math.abs(h.guncangTotal) > 0 ? dom.v/Math.abs(h.guncangTotal)*100 : 0;
  const aktifNama = KEBIJAKAN.filter(p => state.aktif[p.kode]).map(p => p.nama.toLowerCase());
  const madura = ['Kab. Bangkalan','Kab. Sampang','Kab. Pamekasan','Kab. Sumenep'];
  const maduraKena = urut.slice(0,10).filter(r => madura.includes(r.w.nama)).length;
  const rentanKena = urut.slice(0,10).filter(r => (r.w.warn||'').startsWith('KUNING')).length;

  /* skala pembanding terhadap skenario paper */
  let banding;
  if (pct < 0.01) banding = 'praktis netral';
  else if (pct < 0.55) banding = 'lebih ringan daripada guncangan tunggal mana pun yang disimulasikan dalam paper';
  else if (pct < 1.0) banding = 'setara dengan guncangan tunggal berskala menengah';
  else if (pct < 2.21) banding = 'berada di antara guncangan tunggal dan skenario terburuk';
  else banding = 'melampaui skenario terburuk yang dilaporkan paper (\u22122,21%)';

  const s = [];

  /* paragraf 1 — posisi agregat */
  if (h.bersihTotal < 0){
    s.push(`Dengan konfigurasi saat ini, perekonomian Jawa Timur diperkirakan kehilangan
      <span class="angka-inline">${triliun(h.bersihTotal)}</span> atau
      <span class="angka-inline">${fmt(pct,2)}%</span> dari total output.
      Skala kerugian ini <b>${banding}</b>.`);
  } else if (h.bersihTotal > 0){
    s.push(`Paket kebijakan yang dipilih lebih besar daripada guncangan yang disetel, sehingga
      neraca akhirnya justru <b>surplus</b> sebesar
      <span class="angka-inline">${triliun(h.bersihTotal)}</span>
      atau <span class="angka-inline">${fmt(pct,2)}%</span> dari total output.
      Perlu dicatat bahwa manfaat kebijakan bersifat aliran tahunan, sedangkan guncangan
      bersifat sekali kejadian, sehingga keduanya tidak sepenuhnya setara.`);
  } else {
    s.push(`Belum ada guncangan yang disetel. Geser salah satu kanal di panel kiri untuk melihat
      bagaimana tekanan menyebar ke 38 kabupaten/kota.`);
  }

  /* paragraf 2 — kanal dominan */
  if (Math.abs(h.guncangTotal) > 1){
    s.push(`Sumber tekanan terbesar berasal dari <b>${dom.k.nama.toLowerCase()}</b>, yang menyumbang
      ${fmt(domPct,0)}% dari seluruh kerugian. ${dom.k.ket}
      Karena matriks IO-AKI menangkap keterkaitan antarsektor, dampaknya tidak berhenti di pertanian:
      penurunan permintaan antara merambat ke industri pengolahan, perdagangan, dan transportasi
      melalui efek pengganda.`);
  }

  /* paragraf 3 — pola spasial */
  if (Math.abs(h.guncangTotal) > 1){
    let sp = `Secara spasial, beban terberat ditanggung
      <b>${tiga.map(r=>r.w.nama.replace('Kab. ','').replace('Kota ','Kota ')).join('</b>, <b>')}</b>.`;
    if (maduraKena >= 2){
      sp += ` Empat kabupaten di Madura tergolong paling rentan dalam indeks ketahanan pangan paper,
        dan ${maduraKena} di antaranya kini masuk sepuluh besar wilayah terdampak \u2014 pola yang
        mengonfirmasi bahwa guncangan cenderung memperlebar kesenjangan yang sudah ada.`;
    } else if (rentanKena > 0){
      sp += ` Sebagian di antaranya berstatus waspada dalam sistem peringatan dini, sehingga
        guncangan ini menekan wilayah yang kapasitas penyangganya memang sudah tipis.`;
    } else {
      sp += ` Wilayah-wilayah ini umumnya berbasis pertanian luas dengan multiplier output tinggi,
        sehingga guncangan permintaan akhir menghasilkan efek berantai yang besar.`;
    }
    s.push(sp);
  }

  /* paragraf 4 — kebijakan */
  if (aktifNama.length === 0 && Math.abs(h.guncangTotal) > 1){
    s.push(`Belum ada kebijakan penyangga yang diaktifkan. Berdasarkan simulasi paper,
      digitalisasi pertanian memberi rasio manfaat-biaya tertinggi, sedangkan buffer stock strategis
      dan koridor cold chain paling relevan saat tekanan datang dari jalur harga dan distribusi.`);
  } else if (aktifNama.length > 0){
    const peredam = Math.abs(h.guncangTotal) > 0
      ? Math.min(100, Math.abs(h.kebijakanTotal/h.guncangTotal)*100) : 0;
    const daftar = aktifNama.length === 1 ? aktifNama[0]
      : aktifNama.slice(0,-1).join(', ') + ' dan ' + aktifNama.slice(-1);
    s.push(`Kebijakan yang diaktifkan \u2014 ${daftar} \u2014 memberi manfaat tahunan
      <span class="angka-inline">${triliun(h.kebijakanTotal)}</span>,
      ${Math.abs(h.guncangTotal) > 1
        ? `meredam sekitar <b>${fmt(peredam,0)}%</b> kerugian guncangan.`
        : 'meskipun saat ini belum ada guncangan yang perlu diredam.'}
      ${peredam >= 100 && Math.abs(h.guncangTotal) > 1
        ? 'Paket ini secara agregat cukup untuk menutup seluruh kerugian, meski distribusinya antarwilayah tetap timpang.'
        : ''}`);
  }

  /* caveat: penjumlahan linier beberapa kanal bukan skenario G6 paper */
  const nAktif = KANAL.filter((k,i) => state.kanal[k.id] > 0).length;
  if (nAktif >= 3){
    s.push(`<b>Catatan metodologis.</b> Mengaktifkan beberapa kanal sekaligus menjumlahkan dampaknya
      secara linier. Skenario terburuk dalam paper (G6, \u2212Rp43,0 triliun atau \u22122,21%) memakai
      kombinasi terkalibrasi \u2014 penurunan output pertanian 20%, tambahan tekanan pupuk 5%, dan
      koreksi industri 3% \u2014 sehingga angkanya lebih konservatif daripada penjumlahan seluruh kanal
      pada besaran penuh.`);
  }

  el('#narasi').innerHTML =
    `<div class="narasi-kop">Pembacaan otomatis</div>` +
    s.map(t => `<p>${t}</p>`).join('');
}


/* ---------------- preset skenario paper ---------------- */
const PRESET = [
  {n:'Pupuk +30%',      t:'terjadi 2026', v:{g1:0,g2:0,g3:30,g4:0,g5:0}},
  {n:'Kekeringan',      t:'G1',           v:{g1:15,g2:0,g3:0,g4:0,g5:0}},
  {n:'Banjir',          t:'G2',           v:{g1:0,g2:20,g3:0,g4:0,g5:0}},
  {n:'Rantai pasok',    t:'G4',           v:{g1:0,g2:0,g3:0,g4:100,g5:0}},
  {n:'Wereng',          t:'G5',           v:{g1:0,g2:0,g3:0,g4:0,g5:10}}
];
function buildPreset(){
  const host = document.querySelector('#preset-set');
  if (!host) return;
  host.innerHTML = PRESET.map((p,i)=>
    `<button class="pil" data-i="${i}">${p.n}<em>${p.t}</em></button>`).join('');
  host.querySelectorAll('.pil').forEach(b => b.addEventListener('click', () => {
    const v = PRESET[+b.dataset.i].v;
    Object.keys(v).forEach(k => { state.kanal[k] = v[k]; document.querySelector('#'+k).value = v[k]; });
    refresh();
  }));
}

/* ---------------- panel kendali ---------------- */
function buildKendali(){
  el('#slider-set').innerHTML = KANAL.map(k => `
    <div class="kendali">
      <div class="kendali-kop">
        <label class="kendali-nama" for="${k.id}">${k.nama}</label>
        <output class="kendali-nilai" id="out-${k.id}"></output>
      </div>
      <input type="range" id="${k.id}" min="${k.min}" max="${k.max}" step="${k.step}"
             value="${state.kanal[k.id]}" aria-describedby="ket-${k.id}">
      <div class="kendali-ket" id="ket-${k.id}">${k.ket}</div>
    </div>`).join('');

  const bcrMap = {}; META.bcr.forEach(b => bcrMap[b.k.slice(0,2)] = b);
  const gainMap = {}; META.kebijakan.forEach(k => gainMap[k.k.slice(0,2)] = k.gain);
  el('#kebijakan-set').innerHTML = KEBIJAKAN.map(p => `
    <label class="sakelar" for="cb-${p.kode}">
      <input type="checkbox" id="cb-${p.kode}" data-kode="${p.kode}">
      <span class="sakelar-teks">
        <span class="sakelar-nama">${p.nama}</span>
        <span class="sakelar-meta">BCR ${fmt(bcrMap[p.kode]?.npv8||0,2)}
          &middot; ${triliun(gainMap[p.kode]||0)}/tahun</span>
      </span>
    </label>`).join('');

  KANAL.forEach(k => el('#'+k.id).addEventListener('input', e => {
    state.kanal[k.id] = +e.target.value; refresh();
  }));
  document.querySelectorAll('#kebijakan-set input').forEach(cb =>
    cb.addEventListener('change', e => {
      state.aktif[e.target.dataset.kode] = e.target.checked; refresh();
    }));
  el('#reset').addEventListener('click', () => {
    KANAL.forEach(k => { state.kanal[k.id] = 0; el('#'+k.id).value = 0; });
    state.kanal.g3 = 30; el('#g3').value = 30;
    KEBIJAKAN.forEach(p => { state.aktif[p.kode] = false; el('#cb-'+p.kode).checked = false; });
    refresh();
  });
}

function syncOutput(){
  KANAL.forEach(k => {
    const v = state.kanal[k.id];
    const tanda = k.id === 'g3' ? '+' : k.id === 'g4' ? '' : '\u2212';
    el('#out-'+k.id).textContent = (v === 0 ? '0' : tanda + v) +
      (k.satuan === '%' ? '%' : ' ' + k.satuan);
  });
}

/* ---------------- tooltip ---------------- */
function initTip(){
  const tip = el('#tip');
  document.addEventListener('mouseover', e => {
    const u = e.target.closest('.ubin'); if (!u) return;
    const d = u.dataset;
    const pct = +d.p ? Math.abs(+d.b)/+d.p*100 : 0;
    tip.innerHTML = `<div class="t-nama">${d.n}</div>
      <div class="t-baris"><span>Dampak bersih</span><b>${rp(Math.round(+d.b))} M</b></div>
      <div class="t-baris"><span>&nbsp;&nbsp;guncangan</span><b>${rp(Math.round(+d.g))} M</b></div>
      <div class="t-baris"><span>&nbsp;&nbsp;kebijakan</span><b>${+d.m?rp(Math.round(+d.m))+' M':'\u2014'}</b></div>
      <div class="t-baris"><span>Setara PDRB</span><b>${fmt(pct,2)}%</b></div>
      <div class="t-baris"><span>Multiplier tani</span><b>${fmt(+d.mu,3)}</b></div>
      <div class="t-baris"><span>Indeks pangan</span><b>${fmt(+d.f,3)}</b></div>
      <div class="t-baris"><span>Status</span><b>${d.w}</b></div>`;
    tip.classList.add('on');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('.ubin')) tip.classList.remove('on');
  });
  document.addEventListener('mousemove', e => {
    if (!tip.classList.contains('on')) return;
    const x = Math.min(e.clientX + 16, innerWidth - 262);
    const y = Math.min(e.clientY + 16, innerHeight - tip.offsetHeight - 10);
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  });
}

/* ---------------- siklus ---------------- */
function refresh(){
  const h = hitung();
  syncOutput();
  renderPapan(h); renderPeta(h); renderTabel(h); renderNarasi(h); renderKebijakan();
}

buildKendali();
buildPreset();
initTip();
refresh();
