import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Create a clean interface for globalThis to satisfy ESLint
interface CustomGlobal {
  prisma?: PrismaClient;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

// 1. Create a native PostgreSQL connection pool
const pool = new Pool({ connectionString });

// 2. Wrap it inside the Prisma PostgreSQL driver adapter
const adapter = new PrismaPg(pool);

// Cast globalThis safely to avoid ESLint 'any' or 'unknown' warnings
const globalForPrisma = globalThis as typeof globalThis & CustomGlobal;

// 3. Pass the required adapter options directly into the constructor
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
