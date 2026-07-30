-- Adds per-apartment SEO overrides (optional — falls back to name/description
-- when not set). Run this once in the Supabase SQL Editor, same as 0001_init.sql.

alter table apartments add column if not exists seo_title text;
alter table apartments add column if not exists seo_description text;
