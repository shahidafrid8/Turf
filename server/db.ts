import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
let _db: DrizzleDb | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

/** Lazy — safe to import before dotenv runs; throws on first actual DB call if URL is missing. */
export function getDb(): DrizzleDb {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to your .env file.");
  _sql = postgres(url, { ssl: "require", max: 10 });
  _db = drizzle(_sql, { schema });
  return _db;
}

/** Raw postgres client for raw SQL queries */
export function getSql() {
  if (!_sql) getDb(); // initialize if not yet
  return _sql!;
}



