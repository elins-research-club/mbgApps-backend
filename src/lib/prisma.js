const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

// Reuse a single Prisma client across reloads to avoid exhausting DB connections.
const prisma = globalForPrisma.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

module.exports = prisma;
