/*
  Warnings:

  - You are about to drop the `Bahan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Menu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resep` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Bahan";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Menu";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Resep";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ProdukPangan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "energi_kkal" REAL DEFAULT 0,
    "protein_g" REAL DEFAULT 0,
    "lemak_g" REAL DEFAULT 0,
    "karbohidrat_g" REAL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "ProdukPangan_nama_key" ON "ProdukPangan"("nama");
