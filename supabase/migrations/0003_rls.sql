-- =====================================================================
-- Siriba Resort Watamu — Row level security
--
-- Model:
--   anon           -> may read PUBLISHED content only, may write nothing
--   admin_users    -> full access (the owner + staff accounts)
--   service_role   -> bypasses RLS; every mutation in the app is performed
--                     through server actions using the service-role client,
--                     so pricing and availability can never be driven by
--                     values the browser supplies.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Admin membership
-- ---------------------------------------------------------------------
create table admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'owner',
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from admin_users a where a.user_id = auth.uid());
$fn$;

alter table admin_users enable row level security;
create policy admin_users_self_read on admin_users
  for select to authenticated using (user_id = auth.uid() or is_admin());
create policy admin_users_admin_write on admin_users
  for all to authenticated using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------
alter table amenities            enable row level security;
alter table apartments           enable row level security;
alter table apartment_photos     enable row level security;
alter table guests               enable row level security;
alter table bookings             enable row level security;
alter table blocked_dates        enable row level security;
alter table safari_packages      enable row level security;
alter table safari_itinerary_days enable row level security;
alter table safari_photos        enable row level security;
alter table safari_enquiries     enable row level security;
alter table transfer_services    enable row level security;
alter table transfer_photos      enable row level security;
alter table transfer_bookings    enable row level security;
alter table vehicles             enable row level security;
alter table drivers              enable row level security;
alter table messages             enable row level security;
alter table activity_log         enable row level security;
alter table site_settings        enable row level security;
alter table guest_message_log    enable row level security;

-- ---------------------------------------------------------------------
-- Admin full access on every table
-- ---------------------------------------------------------------------
do $do$
declare t text;
begin
  foreach t in array array[
    'amenities','apartments','apartment_photos','guests','bookings','blocked_dates',
    'safari_packages','safari_itinerary_days','safari_photos','safari_enquiries',
    'transfer_services','transfer_photos','transfer_bookings','vehicles','drivers',
    'messages','activity_log','site_settings','guest_message_log'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (is_admin()) with check (is_admin())',
      t || '_admin_all', t);
  end loop;
end
$do$;

-- ---------------------------------------------------------------------
-- Public read: published content only
-- ---------------------------------------------------------------------
create policy amenities_public_read on amenities
  for select to anon, authenticated using (status = 'published');

create policy apartments_public_read on apartments
  for select to anon, authenticated using (status = 'published');

create policy apartment_photos_public_read on apartment_photos
  for select to anon, authenticated using (
    exists (select 1 from apartments a
             where a.id = apartment_photos.apartment_id and a.status = 'published')
  );

create policy safari_packages_public_read on safari_packages
  for select to anon, authenticated using (status = 'published');

create policy safari_days_public_read on safari_itinerary_days
  for select to anon, authenticated using (
    exists (select 1 from safari_packages s
             where s.id = safari_itinerary_days.safari_id and s.status = 'published')
  );

create policy safari_photos_public_read on safari_photos
  for select to anon, authenticated using (
    exists (select 1 from safari_packages s
             where s.id = safari_photos.safari_id and s.status = 'published')
  );

create policy transfer_services_public_read on transfer_services
  for select to anon, authenticated using (status = 'published');

create policy transfer_photos_public_read on transfer_photos
  for select to anon, authenticated using (
    exists (select 1 from transfer_services t
             where t.id = transfer_photos.transfer_id and t.status = 'published')
  );

-- Public drivers list is not exposed; vehicles/drivers stay admin-only.
-- Bookings, guests, enquiries, messages: no anon policy at all -> no anon access.

-- ---------------------------------------------------------------------
-- Public settings: expose only the non-sensitive fields
-- ---------------------------------------------------------------------
create or replace function get_public_settings() returns json
language sql stable security definer set search_path = public as $fn$
  select json_build_object(
    'property_name', property_name,
    'tagline', tagline,
    'logo_path', logo_path,
    'address', address,
    'phone', phone,
    'whatsapp', whatsapp,
    'email', email,
    'facebook_url', facebook_url,
    'instagram_url', instagram_url,
    'tripadvisor_url', tripadvisor_url,
    'map_embed_url', map_embed_url,
    'default_currency', default_currency,
    'hide_prices', hide_prices,
    'usd_to_kes_rate', usd_to_kes_rate,
    'check_in_time', check_in_time,
    'check_out_time', check_out_time,
    'booking_terms', booking_terms,
    'cancellation_policy', cancellation_policy
  ) from site_settings where id;
$fn$;

grant execute on function get_public_settings()          to anon, authenticated;
grant execute on function get_unavailable_dates(uuid, date, date) to anon, authenticated;
grant execute on function is_apartment_available(uuid, date, date, uuid) to anon, authenticated;
grant execute on function dashboard_stats()              to authenticated;
grant execute on function is_admin()                     to anon, authenticated;

-- Availability helpers must never leak guest data — they only return dates.
revoke execute on function expire_stale_holds() from anon, authenticated;
