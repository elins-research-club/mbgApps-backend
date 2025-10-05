-- CreateTable
CREATE TABLE "Bahan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama_bahan" TEXT NOT NULL,
    "energi_kkal" REAL DEFAULT 0,
    "protein_g" REAL DEFAULT 0,
    "lemak_g" REAL DEFAULT 0,
    "karbohidrat_g" REAL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama_menu" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "Bahan_nama_bahan_key" ON "Bahan"("nama_bahan");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_nama_menu_key" ON "Menu"("nama_menu");
