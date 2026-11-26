import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Create the database client the first time it's needed (not at build time).
let sql: NeonQueryFunction<false, false> | null = null;

export function getSql() {
  if (!sql) sql = neon(process.env.DATABASE_URL!);
  return sql;
}
