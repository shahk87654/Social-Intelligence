import { Pool } from "pg";

// Reuse the pool across hot-reloads in dev
const globalForDb = global as unknown as { pgPool?: Pool };

export const pool =
  globalForDb.pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;
