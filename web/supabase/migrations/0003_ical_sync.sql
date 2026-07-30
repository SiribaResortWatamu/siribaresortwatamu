-- Supports two-way iCal sync: apartments.external_ical_urls holds the
-- Airbnb/Booking.com "export calendar" URLs to pull FROM; blocked_dates gets
-- an external_uid so repeated syncs upsert instead of duplicating, and so
-- stale (removed-upstream) blocks can be cleaned up.
-- Run this once in the Supabase SQL Editor, same as the earlier migrations.

alter table apartments add column if not exists external_ical_urls jsonb not null default '[]';

alter table blocked_dates add column if not exists external_uid text;
alter table blocked_dates add column if not exists external_source text;

create unique index if not exists blocked_dates_external_uid_unique
  on blocked_dates (apartment_id, external_uid)
  where external_uid is not null;
