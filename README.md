# 🚀 Backend - Kalkulator Gizi MBG

Ini adalah bagian backend dari aplikasi Kalkulator Gizi. Backend ini bertanggung jawab untuk menyediakan data menu, menerima pilihan pengguna, dan melakukan kalkulasi nutrisi berdasarkan data yang ada di database.

---

### ✅ Prasyarat

Sebelum memulai, pastikan Anda sudah menginstal:

- **Node.js** (versi 18 atau lebih tinggi)
- **npm** (biasanya terinstal bersama Node.js)

---

### ⚙️ Instalasi & Setup

Langkah-langkah berikut adalah untuk setup awal proyek setelah mengambilnya dari GitHub.

1.  **Clone Repository**
    Buka terminal dan jalankan perintah ini untuk mengunduh proyek dari GitHub.

    ```bash
    git clone <URL_REPOSITORY_GITHUB_ANDA>
    ```

2.  **Masuk ke Direktori Backend**

    ```bash
    cd nama-folder-proyek/backend
    ```

3.  **Instal Semua Dependency**
    Perintah ini akan mengunduh semua library yang dibutuhkan oleh backend (seperti Express, Prisma, dll).

    ```bash
    npm install
    ```

4.  **Setup dan Migrasi Database**
    Perintah ini akan membuat database SQLite (`dev.db`) dan semua tabel di dalamnya sesuai dengan skema yang telah kita tentukan.

    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Isi Database (Seeding)**
    Perintah ini akan membaca semua file CSV di folder `/data/csv` dan memasukkannya ke dalam database. **Langkah ini wajib dilakukan agar aplikasi memiliki data.**
    ```bash
    npm run db:seed
    ```

---

### ▶️ Menjalankan Server

Untuk menjalankan server backend dalam mode development, gunakan perintah:

```bash
npm start
```
