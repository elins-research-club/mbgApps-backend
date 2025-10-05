/*
  Warnings:

  - You are about to drop the `ProdukPangan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProdukPangan";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Bahan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "energi_kkal" REAL DEFAULT 0,
    "protein_g" REAL DEFAULT 0,
    "lemak_g" REAL DEFAULT 0,
    "karbohidrat_g" REAL DEFAULT 0,
    "serat_g" REAL DEFAULT 0,
    "abu_g" REAL DEFAULT 0,
    "kalsium_mg" REAL DEFAULT 0,
    "fosfor_mg" REAL DEFAULT 0,
    "besi_mg" REAL DEFAULT 0,
    "natrium_mg" REAL DEFAULT 0,
    "kalium_mg" REAL DEFAULT 0,
    "tembaga_mg" REAL DEFAULT 0,
    "seng_mg" REAL DEFAULT 0,
    "retinol_mcg" REAL DEFAULT 0,
    "b_kar_mcg" REAL DEFAULT 0,
    "karoten_total_mcg" REAL DEFAULT 0,
    "thiamin_mg" REAL DEFAULT 0,
    "riboflavin_mg" REAL DEFAULT 0,
    "niasin_mg" REAL DEFAULT 0,
    "vitamin_c_mg" REAL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Resep" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "menu_id" INTEGER NOT NULL,
    "bahan_id" INTEGER NOT NULL,
    "gramasi" REAL NOT NULL,
    CONSTRAINT "Resep_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "Menu" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Resep_bahan_id_fkey" FOREIGN KEY ("bahan_id") REFERENCES "Bahan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Bahan_nama_key" ON "Bahan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_nama_key" ON "Menu"("nama");
