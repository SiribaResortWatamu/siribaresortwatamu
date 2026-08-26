-- =====================================================================
-- Siriba Resort Watamu — Functions, triggers & business rules
-- =====================================================================

-- ---------------------------------------------------------------------
-- Reference generators
-- ---------------------------------------------------------------------
create or replace function generate_booking_reference() returns trigger
language plpgsql as $fn$
begin
  if new.booking_reference is null or new.booking_reference = '' then
    new.booking_reference := 'SRW-' || nextval('booking_reference_seq')::text;
  end if;
  return new;
end;
$fn$;

create trigger bookings_reference before insert on bookings
  for each row execute function generate_booking_reference();

create or replace function generate_enquiry_reference() returns trigger
language plpgsql as $fn$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'SAF-' || nextval('booking_reference_seq')::text;
  end if;
  return new;
end;
$fn$;

create trigger safari_enquiries_reference before insert on safari_enquiries
  for each row execute function generate_enquiry_reference();

create or replace function generate_transfer_reference() returns trigger
language plpgsql as $fn$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'TRF-' || nextval('booking_reference_seq')::text;
  end if;
  return new;
end;
$fn$;

create trigger transfer_bookings_reference before insert on transfer_bookings
  for each row execute function generate_transfer_reference();

-- ---------------------------------------------------------------------
-- Business rule: a booking may never land on blocked dates
-- (the bookings-vs-bookings case is handled by the exclusion constraint)
-- ---------------------------------------------------------------------
create or replace function bookings_reject_blocked_dates() returns trigger
language plpgsql as $fn$
declare
  conflict_note text;
begin
  if new.booking_status not in ('pending','held','confirmed','completed') then
    return new;
  end if;

  select coalesce(b.note, b.reason::text) into conflict_note
  from blocked_dates b
  where b.apartment_id = new.apartment_id
    and daterange(b.start_date, b.end_date, '[)')
        && daterange(new.check_in, new.check_out, '[)')
  limit 1;

  if found then
    raise exception
      'These dates are unavailable for this accommodation (%). Please choose different dates.',
      coalesce(conflict_note, 'blocked')
      using errcode = 'exclusion_violation';
  end if;

  return new;
end;
$fn$;

create trigger bookings_block_guard before insert or update of check_in, check_out, apartment_id, booking_status
  on bookings for each row execute function bookings_reject_blocked_dates();

-- ---------------------------------------------------------------------
-- Business rule: a block must never silently destroy a live direct booking.
--   * admin blocks   -> hard error, the owner is told to resolve it
--   * imported (iCal) -> row is skipped, the confirmed direct booking wins
-- ---------------------------------------------------------------------
create or replace function blocked_dates_respect_bookings() returns trigger
language plpgsql as $fn$
declare
  conflict_ref text;
begin
  select b.booking_reference into conflict_ref
  from bookings b
  where b.apartment_id = new.apartment_id
    and b.booking_status in ('pending','held','confirmed','completed')
    and daterange(b.check_in, b.check_out, '[)')
        && daterange(new.start_date, new.end_date, '[)')
  limit 1;

  if conflict_ref is not null then
    if new.source = 'admin' then
      raise exception
        'Cannot block these dates: booking % already occupies them.', conflict_ref
        using errcode = 'exclusion_violation';
    else
      -- Imported calendar entry overlaps a direct booking: keep the direct booking.
      return null;
    end if;
  end if;

  return new;
end;
$fn$;

create trigger blocked_dates_booking_guard before insert on blocked_dates
  for each row execute function blocked_dates_respect_bookings();

-- ---------------------------------------------------------------------
-- Derived payment status
-- ---------------------------------------------------------------------
create or replace function derive_payment_status() returns trigger
language plpgsql as $fn$
begin
  if new.payment_status = 'refunded' then
    return new;
  end if;

  if new.amount_paid <= 0 then
    new.payment_status := case
      when new.deposit_required > 0 then 'deposit_required'::payment_status
      else 'unpaid'::payment_status
    end;
  elsif new.amount_paid < new.total_snapshot then
    new.payment_status := 'partially_paid';
  else
    new.payment_status := 'paid';
  end if;

  return new;
end;
$fn$;

create trigger bookings_payment_status before insert or update of amount_paid, total_snapshot, deposit_required
  on bookings for each row execute function derive_payment_status();

create or replace function derive_transfer_payment_status() returns trigger
language plpgsql as $fn$
begin
  if new.payment_status = 'refunded' then
    return new;
  end if;

  if new.amount_paid <= 0 then
    new.payment_status := 'unpaid';
  elsif new.amount_paid < new.price_snapshot then
    new.payment_status := 'partially_paid';
  else
    new.payment_status := 'paid';
  end if;

  return new;
end;
$fn$;

create trigger transfer_bookings_payment_status before insert or update of amount_paid, price_snapshot
  on transfer_bookings for each row execute function derive_transfer_payment_status();

-- ---------------------------------------------------------------------
-- Housekeeping automation: checkout leaves the room needing a clean
-- ---------------------------------------------------------------------
create or replace function booking_housekeeping_sync() returns trigger
language plpgsql as $fn$
begin
  if new.apartment_id is null then
    return new;
  end if;

  if new.booking_status = 'completed' and old.booking_status is distinct from 'completed' then
    update apartments set housekeeping = 'cleaning' where id = new.apartment_id;
  elsif new.booking_status = 'confirmed'
        and old.booking_status is distinct from 'confirmed'
        and new.check_in <= current_date and new.check_out > current_date then
    update apartments set housekeeping = 'occupied' where id = new.apartment_id;
  end if;

  return new;
end;
$fn$;

create trigger bookings_housekeeping after update of booking_status on bookings
  for each row execute function booking_housekeeping_sync();

-- ---------------------------------------------------------------------
-- Activity feed
-- ---------------------------------------------------------------------
create or replace function log_activity(
  p_kind text, p_title text, p_detail text,
  p_entity_type text, p_entity_id uuid
) returns void language sql as $fn$
  insert into activity_log (kind, title, detail, entity_type, entity_id)
  values (p_kind, p_title, p_detail, p_entity_type, p_entity_id);
$fn$;

create or replace function activity_from_booking() returns trigger
language plpgsql as $fn$
begin
  if tg_op = 'INSERT' then
    perform log_activity('booking_created',
      'New booking ' || new.booking_reference,
      new.guest_name_snapshot || ' — ' || new.apartment_name_snapshot,
      'booking', new.id);
  elsif new.booking_status is distinct from old.booking_status then
    perform log_activity('booking_' || new.booking_status::text,
      'Booking ' || new.booking_reference || ' ' || replace(new.booking_status::text, '_', ' '),
      new.guest_name_snapshot || ' — ' || new.apartment_name_snapshot,
      'booking', new.id);
  elsif new.amount_paid > old.amount_paid then
    perform log_activity('payment_received',
      'Payment received on ' || new.booking_reference,
      new.currency || ' ' || to_char(new.amount_paid - old.amount_paid, 'FM999,999,990.00'),
      'booking', new.id);
  end if;
  return null;
end;
$fn$;

create trigger bookings_activity after insert or update on bookings
  for each row execute function activity_from_booking();

create or replace function activity_from_enquiry() returns trigger
language plpgsql as $fn$
begin
  perform log_activity('safari_enquiry',
    'New safari enquiry ' || new.reference,
    new.name || ' — ' || new.safari_name_snapshot,
    'safari_enquiry', new.id);
  return null;
end;
$fn$;

create trigger safari_enquiries_activity after insert on safari_enquiries
  for each row execute function activity_from_enquiry();

create or replace function activity_from_transfer() returns trigger
language plpgsql as $fn$
begin
  perform log_activity('transfer_request',
    'New transfer request ' || new.reference,
    new.passenger_name || ' — ' || new.transfer_name_snapshot,
    'transfer_booking', new.id);
  return null;
end;
$fn$;

create trigger transfer_bookings_activity after insert on transfer_bookings
  for each row execute function activity_from_transfer();

create or replace function activity_from_message() returns trigger
language plpgsql as $fn$
begin
  perform log_activity('message', 'New message from ' || new.name,
    coalesce(new.subject, left(new.message, 80)), 'message', new.id);
  return null;
end;
$fn$;

create trigger messages_activity after insert on messages
  for each row execute function activity_from_message();

-- ---------------------------------------------------------------------
-- Temporary holds expire on their own
-- ---------------------------------------------------------------------
create or replace function expire_stale_holds() returns int
language plpgsql security definer set search_path = public as $fn$
declare
  expired int;
begin
  with released as (
    update bookings
       set booking_status = 'cancelled',
           cancelled_at   = now(),
           hold_expires_at = null,
           notes = concat_ws(E'\n', notes, 'Hold expired automatically at ' || now()::text)
     where booking_status = 'held'
       and hold_expires_at is not null
       and hold_expires_at < now()
    returning id
  )
  select count(*) into expired from released;

  return expired;
end;
$fn$;

-- ---------------------------------------------------------------------
-- Availability helpers
-- ---------------------------------------------------------------------
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
       and (p_exclude_booking is null or b.id <> p_exclude_booking)
       and daterange(b.check_in, b.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
  )
  and not exists (
    select 1 from blocked_dates d
     where d.apartment_id = p_apartment_id
       and daterange(d.start_date, d.end_date, '[)') && daterange(p_check_in, p_check_out, '[)')
  );
$fn$;

-- Every night that cannot be booked, as a flat list of dates.
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

-- ---------------------------------------------------------------------
-- Dashboard summary (one round trip)
-- ---------------------------------------------------------------------
create or replace function dashboard_stats() returns json
language sql stable security definer set search_path = public as $fn$
  select json_build_object(
    'pending_bookings',   (select count(*) from bookings where booking_status in ('pending','held')),
    'confirmed_bookings', (select count(*) from bookings where booking_status = 'confirmed'),
    'arrivals_today',     (select count(*) from bookings
                            where check_in = current_date
                              and booking_status in ('confirmed','pending','held')),
    'departures_today',   (select count(*) from bookings
                            where check_out = current_date and booking_status in ('confirmed','completed')),
    'current_guests',     (select coalesce(sum(guests_count), 0) from bookings
                            where booking_status = 'confirmed'
                              and check_in <= current_date and check_out > current_date),
    'outstanding_balance',(select coalesce(sum(balance), 0) from bookings
                            where booking_status in ('confirmed','completed')
                              and payment_status <> 'refunded' and balance > 0),
    'safari_enquiries',   (select count(*) from safari_enquiries where status = 'new'),
    'transfer_requests',  (select count(*) from transfer_bookings where booking_status = 'pending'),
    'unread_messages',    (select count(*) from messages where status = 'unread'),
    'rooms_needing_clean',(select count(*) from apartments
                            where housekeeping = 'cleaning' and status <> 'archived')
  );
$fn$;
