const { seedMealPlan, seedResepNew } = require("./seed");
const prisma = require("../lib/prisma");

async function seed() {
  await seedResepNew();
  // await seedMealPlan();
}

seed()
  .catch((e) => {
    console.error("❌ Terjadi error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("--- KONEKSI DATABASE DITUTUP ---");
  });
