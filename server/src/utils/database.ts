import { Pool } from "pg";

const globalForDb = globalThis as unknown as { db: Pool | undefined };

export const db =
  globalForDb.db ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Force SSL
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

export default db;
