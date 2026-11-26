// Creates the tables in your Neon database.
// Run with: npm run db:setup   (reads DATABASE_URL from .env.local)
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

// Neon runs one statement at a time, so split the file on ";"
const statements = schema
  .split(";")
  .map((s) => s.replace(/--.*$/gm, "").trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}
console.log(`Done — ran ${statements.length} statements.`);
