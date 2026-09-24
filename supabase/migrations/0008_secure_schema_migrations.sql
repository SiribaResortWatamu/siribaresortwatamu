-- =====================================================================
-- Lock down the migration ledger.
--
-- `schema_migrations` is created by scripts/migrate.mjs, not by a
-- migration, so it never passed through 0003_rls.sql — which is where
-- every other table in this schema gets row level security switched on.
-- It therefore sat in the public schema with RLS disabled and Supabase's
-- default grants intact, which PostgREST happily exposed: the anon key
-- embedded in the website's JavaScript could read every row, insert new
-- ones and delete existing ones.
--
-- What leaked was only migration filenames and timestamps, so no guest
-- or booking data was ever reachable this way. The write access mattered
-- more than the read: deleting rows would make the next migrate run
-- replay files that had already been applied — 0005_seed.sql among them,
-- which would push demo content back into a live site — and inserting a
-- row naming a future migration would make the runner skip it silently.
--
-- No policies are added on purpose. With RLS on and nothing granting
-- access, anon and authenticated get nothing at all. `service_role`
-- bypasses RLS, and migrate.mjs connects as the table's owner, which
-- bypasses it too — so the runner keeps working untouched.
-- =====================================================================

alter table schema_migrations enable row level security;

revoke all on schema_migrations from anon, authenticated;

comment on table schema_migrations is
  'Applied migration files, written by scripts/migrate.mjs. RLS on with no policies: reachable only by the migration runner and the service role.';
