import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

interface CustomGlobal {
  prisma?: PrismaClient;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as typeof globalThis & CustomGlobal;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { pool };

export default prisma;
