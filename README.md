# Geo Entity Manager

Aplikasi web full-stack untuk menampilkan dan mengelola entitas yang berlokasi secara geografis pada peta interaktif.

Aplikasi ini memungkinkan pengguna untuk melihat lokasi entitas, memeriksa detail entitas, membuat entitas baru, memperbarui entitas yang sudah ada, menghapus entitas, dan mencari entitas berdasarkan nama.

## Fitur

- **Interactive Map:** Menampilkan lokasi entitas menggunakan Leaflet dan OpenStreetMap.
- **Entity Management:** Membuat, membaca, memperbarui, dan menghapus entitas.
- **Entity Details:** Melihat atribut, status, deskripsi, dan koordinat geografis entitas.
- **Search:** Menyaring daftar entitas berdasarkan nama.
- **Data Persistence:** Menyimpan data entitas dalam basis data SQLite.
- **Input Validation:** Memvalidasi bidang entitas dan koordinat geografis baik di sisi frontend maupun backend.
- **REST API:** Mengambil dan mengelola data entitas melalui backend Go.

## Technology Stack

| Komponen             | Teknologi          | Fungsi                                     |
| -------------------- | ------------------ | ------------------------------------------ |
| Frontend             | React              | Membuat tampilan user interface            |
| Programming Language | TypeScript         | Menyediakan static type checking           |
| Development Server   | Vite               | Pengembangan frontend dan alat untuk build |
| Map Library          | Leaflet            | Render peta dan penanda interaktif         |
| React Integration    | React Leaflet      | Integrasi Leaflet dengan komponen React    |
| Backend              | Go                 | Implementasi REST API                      |
| HTTP Framework       | Gin                | meng-handle HTTP request dan routing       |
| Database             | SQLite             | Menyimpan data entitas                     |
| SQLite Driver        | modernc.org/sqlite | Koneksi backend Go ke DB SQLite tanpa CGO  |
| Map Provider         | OpenStreetMap      | Menyediakan kotak peta                     |

## Architecture

Aplikasi ini menggunakan arsitektur frontend-backend.

```text
React + TypeScript + Leaflet
             |
             | HTTP requests
             v
       Vite Development Proxy
             |
             v
          Go + Gin
             |
             v
           SQLite
```

Selama proses pengembangan, frontend berjalan di port `5173` dan backend berjalan di port `8080`. Vite meneruskan permintaan yang diawali dengan `/api` ke backend.

Data entitas diambil dari dan disimpan melalui API backend.

## Spesifikasi Kebutuhan

Instal perangkat lunak berikut ini sebelum menjalankan aplikasi:

- Go
- Node.js dan npm
- Git
- Aplikasi web browser

Proyek ini dikembangkan dan diuji secara lokal dalam lingkungan Windows atau Sistem Operasi lainnya. Silakan lihat dependensi proyek yang terpasang dan berkas modul Go untuk mengetahui versi pustaka yang tepat.

## Persiapan

### 1. Clone/salin repositori

```powershell
git clone <YOUR_REPOSITORY_URL>
cd geo-entity-manager
```

Ganti `<YOUR_REPOSITORY_URL>` dengan URL repositori Git yang sebenarnya.

Jika Anda sudah memiliki proyek tersebut secara lokal, buka direktori root saja.

### 2. Jalankan backend

Buka terminal di dalam root project dan jalankan:

```powershell
cd backend
go mod download
go run .
```

Server Go harus berjalan pada:

`http://localhost:8080`

Aplikasi ini akan membuat basis data SQLite dan tabel `entities` jika keduanya belum ada.

Berkas basis data lokal dibuat relatif terhadap direktori kerja proses backend. Jalankan perintah `go run .` dari direktori `backend` agar basis data tersimpan di lokasi yang diharapkan.

### 3. Jalankan frontend

Buka terminal kedua di dalam root project dan jalankan:

```powershell
cd frontend
npm install
npm run dev
```

Vite harus tersedia pada URL local development:

`http://localhost:5173`

Buka alamat tersebut di peramban Anda untuk mengakses aplikasi tersebut.

Pastikan kedua server pengembangan tetap berjalan selama Anda menggunakan aplikasi tersebut.

## Entity Data Model

Setiap entitas memiliki atribut-atribut berikut:

| Field         | Tipe    | Deskripsi                                       |
| ------------- | ------- | ----------------------------------------------- |
| `id`          | Integer | Identifier unik yang dihasilkan oleh basis data |
| `name`        | String  | Nama entitas                                    |
| `type`        | String  | Kategori entitas                                |
| `status`      | String  | Status entitas                                  |
| `latitude`    | Number  | Lintang geografis, dari -90 hingga 90           |
| `longitude`   | Number  | Bujur geografis, dari -180 hingga 180           |
| `description` | String  | Informasi tambahan mengenai entitas             |

Tipe entitas yang mendukung:

- `vehicle`
- `iot_device`
- `facility`

Status entitas yang mendukung:

- `active`
- `inactive`
- `maintenance`

## API Reference

API ini tersedia di `http://localhost:8080`. Saat menggunakan server pengembangan frontend, permintaan API juga dapat dilakukan melalui proxy Vite di `http://localhost:5173`.

| Method | Endpoint            | Deskripsi                     |
| ------ | ------------------- | ----------------------------- |
| GET    | `/api/health`       | Cek kesehatan backend         |
| GET    | `/api/entities`     | Menampilkan semua entitas     |
| GET    | `/api/entities/:id` | Menampilkan detail entitas    |
| POST   | `/api/entities`     | Menambahkan data entitas baru |
| PUT    | `/api/entities/:id` | Mengubah data entitas         |
| DELETE | `/api/entities/:id` | Menghapus data entitas        |

### Contoh: Membuat Entitas Baru

Request:

```http
POST /api/entities
Content-Type: application/json
```

```json
{
  "name": "Warehouse Sensor A",
  "type": "iot_device",
  "status": "active",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "description": "Warehouse temperature sensor"
}
```

Pembuatan yang berhasil akan mengembalikan respons HTTP `201 Created` beserta entitas yang telah dibuat, termasuk ID yang dihasilkan.

### Contoh: Menampilkan Semua Entitas

```http
GET /api/entities
```

Endpoint ini mengembalikan sebuah array JSON yang berisi entitas-entitas yang terdaftar. Jika tidak ada data, endpoint ini mengembalikan array kosong.

### Error Handling

API ini mengembalikan respons kesalahan HTTP yang sesuai untuk kasus-kasus kegagalan yang umum, termasuk:

- `400 Bad Request` untuk input tidak valid atau JSON tidak valid.
- `404 Not Found` jika data entitas tidak ada.
- `500 Internal Server Error` untuk kesalahan di sisi server.

Respons kesalahan berisi objek JSON yang memiliki field `error`.

## Validasi

Frontend memvalidasi kolom yang wajib diisi dan rentang koordinat geografis sebelum mengirimkan permintaan.

Backend secara mandiri memvalidasi data entitas, termasuk:

- Nama entitas yang wajib diisi.
- Jenis entitas yang didukung.
- Status entitas yang didukung.
- Lintang dan bujur yang wajib diisi.
- Lintang dalam rentang `-90` hingga `90`.
- Bujur dalam rentang `-180` hingga `180`.
- Nilai koordinat numerik yang terbatas.

Validasi backend tetap menjadi acuan utama meskipun validasi frontend juga dilakukan.

## Cara Menggunakan dan Menjalankan Program

1. Jalankan server backend dan frontend.
2. Buka aplikasi di web browser.
3. Lihat entitas yang terdaftar di sidebar dan direktori entitas.
4. Pilih sebuah entitas untuk melihat detail dan lokasinya di peta.
5. Gunakan **Add Entity** untuk membuat entitas baru.
6. Pilih entitas yang sudah ada dan gunakan **Edit** untuk mengubah informasinya.
7. Gunakan **Delete** untuk menghapus entitas setelah mengonfirmasi tindakan tersebut.
8. Gunakan kolom pencarian (search) untuk menyaring entitas berdasarkan nama.

Perubahan dikirim ke API backend dan disimpan secara permanen di SQLite.

## Testing

Aplikasi ini diuji secara manual selama tahap pengembangan menggunakan lingkungan sistem operasi lokal, terminal, dan web browser.

Verifikasi manual meliputi:

- Memeriksa titik akhir (endpoint) kesehatan backend.
- Mengambil daftar entitas dan catatan entitas individual.
- Membuat entitas dan memeriksa data yang dikembalikan.
- Memperbarui entitas dan memverifikasi perubahan yang tersimpan.
- Menghapus entitas dan memeriksa catatan yang tersisa.
- Memverifikasi bahwa penanda dan detail entitas muncul di peta.
- Menguji koneksi frontend ke backend melalui proxy Vite.

Cakupan pengujian unit dan integrasi otomatis belum ditetapkan sebagai bagian dari implementasi ini, kecuali jika pengujian tambahan ditambahkan sebelum penyerahan.

Sebelum menyerahkan, verifikasi kondisi akhir aplikasi dan dokumentasikan pengujian apa pun yang masih belum selesai.

## Pemilihan Teknologi dan Library

### React dan TypeScript

React menawarkan pendekatan berbasis komponen untuk membangun dashboard. TypeScript membantu mendeteksi kesalahan terkait tipe selama proses pengembangan dan memudahkan pemeliharaan struktur data entitas.

### Vite

Vite menyediakan server pengembangan yang cepat, alat bantu pembuatan frontend, dan proxy pengembangan untuk berkomunikasi dengan API Go.

### Leaflet dan React Leaflet

Leaflet mendukung peta interaktif dan penanda geografis. React Leaflet mengintegrasikan kemampuan tersebut dengan komponen React, sehingga penanda dan detail entitas yang dipilih dapat menyesuaikan diri dengan state aplikasi.

### Go dan Gin

Go menyediakan backend yang dikompilasi dengan karakteristik konkurensi dan penerapan yang mudah dipahami. Gin menyederhanakan perutean HTTP dan penanganan permintaan untuk API REST.

### SQLite

SQLite cocok untuk aplikasi kecil karena menyediakan penyimpanan relasional yang persisten tanpa memerlukan server basis data terpisah.

### OpenStreetMap

OpenStreetMap menyediakan data peta yang dapat ditampilkan melalui layanan tile standarnya tanpa memerlukan API key untuk pengaturan pengembangan ini. Ketersediaan dan penggunaan tile tetap tunduk pada kebijakan penggunaan dari penyedia layanan.

## Penggunaan AI-Agentic

ChatGPT digunakan sebagai asisten pemrograman dan panduan teknis selama proses pengembangan.

Alur kerja tersebut terdiri dari:

1. Meminta panduan implementasi langkah demi langkah kepada ChatGPT.
2. Meninjau penjelasan dan saran kode.
3. Menyalin kode yang disarankan secara manual ke dalam proyek.
4. Melakukan modifikasi kecil pada kode jika diperlukan.
5. Menjalankan aplikasi secara lokal dan menguji titik akhir API.
6. Menggunakan perilaku yang diamati dan pesan kesalahan sebagai panduan untuk proses debugging dan perubahan selanjutnya.

Tidak ada agent pemrograman otonom yang digunakan selama alur kerja pengembangan yang dijelaskan di atas.

Kandidat tetap bertanggung jawab atas pengaturan proyek, menerapkan perubahan kode, menjalankan pengujian, meninjau implementasi, dan menyiapkan pengiriman hasil.

Rincian lebih lanjut tersedia di `AGENTS.md`.

## Limitasi and Perbaikan Mendatang

Peningkatan yang dapat dilakukan antara lain:

- Pengujian unit dan integrasi otomatis.
- Peningkatan penanganan kesalahan pada API dan antarmuka pengguna.
- Pagination dan penyaringan untuk kumpulan data yang lebih besar.
- Pengujian aksesibilitas dan tata letak responsif tambahan.
- Konfigurasi penerapan ke lingkungan produksi.
- Dokumentasi API yang lebih lengkap.
- Lokasi basis data yang dapat dikonfigurasi dan pengaturan berdasarkan lingkungan.

Hanya fitur-fitur yang masih belum selesai pada saat pengajuan yang harus dicantumkan sebagai keterbatasan yang masih ada.

## Struktur Repositori

```text
geo-entity-manager/
├── AGENTS.md
├── README.md
├── .gitignore
├── backend/
│   ├── main.go
│   ├── go.mod
│   └── go.sum
└── frontend/
    ├── src/
    ├── package.json
    ├── package-lock.json
    ├── vite.config.ts
    └── index.html
```

Mungkin terdapat berkas tambahan yang dihasilkan dan berkas sumber di repositori yang sebenarnya.

## License

Proyek ini dibuat sebagai bagian dari Software Developer take-home test.
