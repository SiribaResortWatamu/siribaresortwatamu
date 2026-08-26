-- =====================================================================
-- Stop availability from depending on how often the cron runs.
--
-- A temporary hold is meant to last a few hours. On Vercel's Hobby plan
-- cron jobs may only run once a day, so a sweep-only design would leave
-- an abandoned hold blocking dates for up to 24 hours.
--
-- Two changes fix that:
--   1. the availability *reads* below ignore holds that have already
--      expired, so the public calendar frees the dates immediately;
--   2. `createBooking` calls `expire_stale_holds()` before it checks
--      availability, so the row is really gone before the exclusion
--      constraint is consulted.
--
-- The exclusion constraint itself cannot do this — its predicate has to
-- be immutable, and `now()` is not. The daily cron stays as a safety net
-- for holds nobody ever tries to book over.
-- =====================================================================

create or replace function is_apartment_available(
  p_apartment_id uuid,
  p_check_in     date,
  p_check_out    date,
  p_exclude_booking uuid default null
) returns boolean
language sql stable security definer set search_path = public as $fn$
  select not exists (
    select 1 from bookings b
     where b.apartment_id = p_apartment_id
       and b.booking_status in ('pending','held','confirmed','completed')
       -- An expired hold no longer occupies the dates.
       and not (
         b.booking_status = 'held'
         and b.hold_expires_at is not null
         and b.hold_expires_at < now()
       )
       and (p_exclude_booking is null or b.id <> p_exclude_booking)
       and daterange(b.check_in, b.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
  )
  and not exists (
    select 1 from blocked_dates d
     where d.apartment_id = p_apartment_id
       and daterange(d.start_date, d.end_date, '[)') && daterange(p_check_in, p_check_out, '[)')
  );
$fn$;

create or replace function get_unavailable_dates(
  p_apartment_id uuid,
  p_from date default current_date,
  p_to   date default (current_date + interval '18 months')::date
) returns setof date
language sql stable security definer set search_path = public as $fn$
  select distinct d::date
  from (
    select generate_series(
             greatest(b.check_in, p_from),
             greatest(b.check_out - 1, greatest(b.check_in, p_from)),
             interval '1 day'
           ) as d
      from bookings b
     where b.apartment_id = p_apartment_id
       and b.booking_status in ('pending','held','confirmed','completed')
       and not (
         b.booking_status = 'held'
         and b.hold_expires_at is not null
         and b.hold_expires_at < now()
       )
       and b.check_out > p_from and b.check_in < p_to
    union all
    select generate_series(
             greatest(k.start_date, p_from),
             greatest(k.end_date - 1, greatest(k.start_date, p_from)),
             interval '1 day'
           )
      from blocked_dates k
     where k.apartment_id = p_apartment_id
       and k.end_date > p_from and k.start_date < p_to
  ) s
  where d::date >= p_from and d::date < p_to
  order by 1;
$fn$;

grant execute on function get_unavailable_dates(uuid, date, date) to anon, authenticated;
grant execute on function is_apartment_available(uuid, date, date, uuid) to anon, authenticated;
