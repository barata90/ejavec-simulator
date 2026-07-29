[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-klik%20di%20sini-brightgreen?style=flat-square&logo=github)](https://barata90.github.io/ejavec-simulator/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Research Paper](https://img.shields.io/badge/Paper-EJAVEC%202026-blue)](https://contoh-link-paper.com)

# Simulator Ketahanan Pangan & Kebijakan Jawa Timur 2026

Aplikasi web interaktif untuk mensimulasikan guncangan pangan dan kebijakan penyangga di
**38 kabupaten/kota Jawa Timur**, lengkap dengan pembacaan naratif otomatis.

Dibangun dari hasil penelitian *"Nowcasting Ketahanan Pangan, Proyeksi Ekonomi, dan Simulasi
Kebijakan Jawa Timur 2026: Pendekatan Machine Learning Geospasial, Input-Output Regional
Antarwilayah, dan Analisis Skenario Krisis Geopolitik"* (EJAVEC 2026).

---

## Apa yang bisa dilakukan

- **Menyetel lima kanal guncangan** — kekeringan El Niño, banjir La Niña, kenaikan harga pupuk,
  gangguan rantai pasok, dan serangan wereng coklat.
- **Mengaktifkan kebijakan penyangga** — hilirisasi, irigasi, cold chain, buffer stock, dan
  digitalisasi pertanian, masing-masing dengan rasio manfaat-biaya dari hasil penelitian.
- **Membaca sebaran dampak** pada peta ubin skematis Jawa Timur yang berubah warna secara langsung.
- **Memperoleh interpretasi otomatis** dalam bahasa Indonesia yang menyesuaikan diri dengan
  konfigurasi: skala kerugian, kanal dominan, pola spasial, dan efektivitas kebijakan.

## Menjalankan

Aplikasi ini sepenuhnya statis — tanpa backend, tanpa proses build.

```bash
git clone https://github.com/barata90/<nama-repo>.git
cd <nama-repo>
# buka index.html langsung di peramban, atau:
python3 -m http.server 8000   # lalu kunjungi http://localhost:8000
```

Untuk menerbitkannya lewat GitHub Pages: buka **Settings → Pages**, pilih branch `main`
dan folder `/ (root)`.

## Struktur berkas

```
index.html            # kerangka halaman
assets/style.css      # sistem desain
assets/app.js         # mesin simulasi, peta ubin, generator narasi
assets/data.js        # data 38 wilayah, diturunkan dari keluaran notebook
notebook/             # notebook analisis (pipeline lengkap)
data/                 # keluaran CSV dari notebook
```

## Asal angka

Seluruh nilai berasal langsung dari keluaran notebook penelitian. Tidak ada angka yang
dihitung ulang atau diperkirakan di sisi peramban.

| Berkas sumber | Dipakai untuk |
|---|---|
| `shock_impact_by_region.csv` | dampak enam skenario guncangan per wilayah |
| `policy_by_region.csv` | manfaat lima kebijakan per wilayah |
| `fsi_ranking.csv` | indeks ketahanan pangan komposit |
| `vulnerability_map.csv` | skor kerentanan dan status peringatan dini |
| `ranking_pertanian_multiplier.csv` | multiplier output dan spillover antarwilayah |
| `policy_impact_comparison.csv`, `policy_bcr_enhanced.csv` | rasio manfaat-biaya dan Monte Carlo |
| `pdrb_growth_projection_2026.csv` | PDRB dan proyeksi pertumbuhan |

## Catatan metodologi

**Penskalaan bersifat sah.** Model Leontief linier, sehingga menskalakan besaran guncangan
terhadap hasil dasar notebook secara matematis benar. Menggeser slider harga pupuk dari 30%
ke 60% menghasilkan tepat dua kali lipat dampaknya.

**Menggabungkan kanal bukanlah skenario G6.** Mengaktifkan beberapa kanal sekaligus
menjumlahkan dampaknya secara linier. Skenario terburuk dalam penelitian
(G6, −Rp43,0 triliun atau −2,21%) memakai kombinasi terkalibrasi — penurunan output pertanian
20%, tambahan tekanan pupuk 5%, dan koreksi industri 3% — sehingga lebih konservatif daripada
penjumlahan seluruh kanal pada besaran penuh. Aplikasi memunculkan catatan ini secara otomatis
ketika tiga kanal atau lebih diaktifkan.

**Basis persentase.** Dampak dihitung terhadap total output perekonomian Jawa Timur dalam
kerangka IO-AKI sebesar **Rp1.945.328 miliar**, bukan terhadap PDRB.

**Manfaat kebijakan bersifat aliran tahunan**, sedangkan guncangan bersifat sekali kejadian.
Keduanya tidak sepenuhnya setara dan sebaiknya dibaca sebagai perbandingan orde besaran.

**Peta bersifat skematis.** Susunan ubin mendekati posisi geografis (Madura terpisah di baris
atas, Pacitan di barat daya, Banyuwangi di ujung timur), bukan proyeksi kartografis.

## Sitasi

Jika Anda memakai aplikasi atau datanya, mohon sitasi paper aslinya:

> Barata, A. (2026). *Nowcasting Ketahanan Pangan, Proyeksi Ekonomi, dan Simulasi Kebijakan
> Jawa Timur 2026: Pendekatan Machine Learning Geospasial, Input-Output Regional Antarwilayah,
> dan Analisis Skenario Krisis Geopolitik.* East Java Economic Forum (EJAVEC) 2026.

## Lisensi

Kode: MIT. Data dan hasil penelitian: mohon sitasi sebagaimana di atas.
