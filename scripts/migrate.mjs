#!/usr/bin/env node
/**
 * Apply the SQL files in supabase/migrations, in order.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/migrate.mjs
 *   node scripts/migrate.mjs --only 0005      # just one file
 *
 * Each file runs inside its own transaction, so a failure rolls that file
 * back rather than leaving the schema half-applied. Applied files are
 * recorded in `schema_migrations`, so re-running is safe.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const DIR = join(process.cwd(), "supabase", "migrations");
const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]
  : null;
const force = process.argv.includes("--force");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set DATABASE_URL to your Supabase connection string.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  // Seeds and DDL can take a moment on a cold project.
  statement_timeout: 120_000,
});

try {
  await client.connect();
  const { rows } = await client.query("select current_database() db, version()");
  console.log(`Connected to ${rows[0].db}\n${rows[0].version.split(",")[0]}\n`);

  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const applied = new Set(
    (await client.query("select filename from schema_migrations")).rows.map(
      (r) => r.filename,
    ),
  );

  const files = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .filter((f) => !only || f.startsWith(only))
    .sort();

  let ran = 0;

  for (const file of files) {
    if (applied.has(file) && !force) {
      console.log(`- ${file}  (already applied)`);
      continue;
    }

    const sql = readFileSync(join(DIR, file), "utf8");
    process.stdout.write(`> ${file} ... `);

    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(
        `insert into schema_migrations (filename) values ($1)
         on conflict (filename) do update set applied_at = now()`,
        [file],
      );
      await client.query("commit");
      console.log("ok");
      ran += 1;
    } catch (error) {
      await client.query("rollback");
      console.log("FAILED");
      console.error(`\n  ${error.message}`);
      if (error.position) {
        const upto = sql.slice(0, Number(error.position));
        const line = upto.split("\n").length;
        console.error(`  at line ${line}: ${sql.split("\n")[line - 1]?.trim()}`);
      }
      if (error.hint) console.error(`  hint: ${error.hint}`);
      if (error.detail) console.error(`  detail: ${error.detail}`);
      process.exit(1);
    }
  }

  console.log(`\nDone — ${ran} file(s) applied.`);
} finally {
  await client.end();
}
