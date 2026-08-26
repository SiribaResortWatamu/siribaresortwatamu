-- =====================================================================
-- Siriba Resort Watamu — Core schema
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type content_status      as enum ('draft','published','hidden','archived');
create type booking_status      as enum ('pending','held','confirmed','cancelled','completed','no_show');
create type payment_status      as enum ('unpaid','deposit_required','partially_paid','paid','refunded');
create type booking_source      as enum ('website','airbnb','booking_com','admin','whatsapp','other');
create type enquiry_status      as enum ('new','contacted','quoted','confirmed','cancelled','completed');
create type transfer_status     as enum ('pending','confirmed','driver_assigned','in_progress','completed','cancelled');
create type housekeeping_status as enum ('available','occupied','cleaning','ready','maintenance');
create type message_status      as enum ('unread','read','replied','archived');
create type pricing_method      as enum ('fixed','per_person','per_vehicle','hourly','on_enquiry');
create type price_display_mode  as enum ('show_price','from_price','on_enquiry');
create type block_reason        as enum ('maintenance','owner_stay','private_event','external_ical','other');
create type block_source        as enum ('admin','airbnb','booking_com','other');
create type resource_status     as enum ('active','inactive');

-- ---------------------------------------------------------------------
-- Shared helper: updated_at
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

-- ---------------------------------------------------------------------
-- Amenities (shared catalogue, CMS-managed)
-- ---------------------------------------------------------------------
create table amenities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  icon          text not null default 'sparkles',
  description   text,
  display_order int  not null default 0,
  is_featured   boolean not null default false,
  status        content_status not null default 'published',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger amenities_updated_at before update on amenities
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Accommodation
-- ---------------------------------------------------------------------
create table apartments (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null unique,
  short_description     text,
  full_description      text,
  property_type         text not null default 'Apartment',
  location              text,
  max_guests            int  not null default 2 check (max_guests > 0),
  bedrooms              int  not null default 1 check (bedrooms >= 0),
  bathrooms             int  not null default 1 check (bathrooms >= 0),
  beds                  int  not null default 1 check (beds >= 0),
  nightly_rate          numeric(12,2) not null default 0 check (nightly_rate >= 0),
  currency              text not null default 'KES',
  min_nights            int  not null default 1 check (min_nights >= 1),
  cleaning_fee          numeric(12,2) not null default 0 check (cleaning_fee >= 0),
  deposit_percent       int  not null default 30 check (deposit_percent between 0 and 100),
  amenity_ids           uuid[] not null default '{}',
  housekeeping          housekeeping_status not null default 'available',
  status                content_status not null default 'draft',
  display_order         int  not null default 0,
  is_featured           boolean not null default false,
  seo_title             text,
  seo_description       text,
  og_image_path         text,
  airbnb_ical_url       text,
  booking_com_ical_url  text,
  ical_export_token     uuid not null default gen_random_uuid(),
  last_synced_at        timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index apartments_status_idx on apartments (status);
create trigger apartments_updated_at before update on apartments
  for each row execute function set_updated_at();

create table apartment_photos (
  id            uuid primary key default gen_random_uuid(),
  apartment_id  uuid not null references apartments(id) on delete cascade,
  storage_path  text not null,
  alt_text      text,
  display_order int not null default 0,
  is_cover      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index apartment_photos_apartment_idx on apartment_photos (apartment_id, display_order);
create unique index apartment_photos_one_cover_idx
  on apartment_photos (apartment_id) where is_cover;

-- ---------------------------------------------------------------------
-- Guests
-- ---------------------------------------------------------------------
create table guests (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  whatsapp    text,
  country     text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index guests_email_key on guests (lower(email));
create trigger guests_updated_at before update on guests
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------
create sequence booking_reference_seq start 1000;

create table bookings (
  id                 uuid primary key default gen_random_uuid(),
  booking_reference  text not null unique,
  guest_id           uuid references guests(id) on delete set null,
  apartment_id       uuid references apartments(id) on delete restrict,

  -- Immutable snapshots (survive archival / renaming of the apartment)
  apartment_name_snapshot text not null,
  guest_name_snapshot     text not null,
  guest_email_snapshot    text not null,
  guest_phone_snapshot    text,

  check_in           date not null,
  check_out          date not null,
  guests_count       int  not null default 1 check (guests_count > 0),
  nights             int generated always as (check_out - check_in) stored,

  rate_snapshot         numeric(12,2) not null default 0,
  cleaning_fee_snapshot numeric(12,2) not null default 0,
  total_snapshot        numeric(12,2) not null default 0,
  currency              text not null default 'KES',

  deposit_required   numeric(12,2) not null default 0,
  amount_paid        numeric(12,2) not null default 0,
  balance            numeric(12,2) generated always as (total_snapshot - amount_paid) stored,
  payment_method     text,
  payment_reference  text,
  payment_date       date,
  payment_notes      text,

  booking_status     booking_status not null default 'pending',
  payment_status     payment_status not null default 'unpaid',
  source             booking_source not null default 'website',
  hold_expires_at    timestamptz,

  special_requests   text,
  notes              text,
  external_uid       text,

  confirmed_at       timestamptz,
  cancelled_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint bookings_date_order check (check_out > check_in)
);

create index bookings_apartment_dates_idx on bookings (apartment_id, check_in, check_out);
create index bookings_status_idx on bookings (booking_status);
create index bookings_checkin_idx on bookings (check_in);
create unique index bookings_external_uid_idx on bookings (apartment_id, external_uid)
  where external_uid is not null;
create trigger bookings_updated_at before update on bookings
  for each row execute function set_updated_at();

-- === DOUBLE-BOOKING PROTECTION (database level) ======================
-- Two bookings that occupy dates for the same apartment can never overlap.
-- Half-open range so a checkout on the same day as the next check-in is legal.
alter table bookings
  add constraint bookings_no_overlap
  exclude using gist (
    apartment_id with =,
    daterange(check_in, check_out, '[)') with &&
  )
  where (booking_status in ('pending','held','confirmed','completed'));

-- ---------------------------------------------------------------------
-- Blocked dates (admin blocks + imported external calendars)
-- ---------------------------------------------------------------------
create table blocked_dates (
  id           uuid primary key default gen_random_uuid(),
  apartment_id uuid references apartments(id) on delete cascade,
  start_date   date not null,
  end_date     date not null,
  reason       block_reason not null default 'other',
  source       block_source not null default 'admin',
  note         text,
  external_uid text,
  created_at   timestamptz not null default now(),
  constraint blocked_dates_order check (end_date > start_date)
);
create index blocked_dates_apartment_idx on blocked_dates (apartment_id, start_date, end_date);
create unique index blocked_dates_external_uid_idx
  on blocked_dates (apartment_id, source, external_uid) where external_uid is not null;

-- ---------------------------------------------------------------------
-- Safaris
-- ---------------------------------------------------------------------
create table safari_packages (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  short_description  text,
  full_description   text,
  destination        text,
  duration           text,
  duration_days      int not null default 1,
  starting_location  text,
  ending_location    text,
  safari_type        text,
  price              numeric(12,2) not null default 0,
  currency           text not null default 'USD',
  price_display_mode price_display_mode not null default 'from_price',
  highlights         text[] not null default '{}',
  included           text[] not null default '{}',
  excluded           text[] not null default '{}',
  optional_extras    text[] not null default '{}',
  important_info     text,
  status             content_status not null default 'draft',
  display_order      int not null default 0,
  is_featured        boolean not null default false,
  seo_title          text,
  seo_description    text,
  og_image_path      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index safari_packages_status_idx on safari_packages (status);
create trigger safari_packages_updated_at before update on safari_packages
  for each row execute function set_updated_at();

create table safari_itinerary_days (
  id            uuid primary key default gen_random_uuid(),
  safari_id     uuid not null references safari_packages(id) on delete cascade,
  day_number    int not null,
  title         text not null,
  description   text,
  activities    text[] not null default '{}',
  accommodation text,
  meals         text,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);
create index safari_itinerary_days_safari_idx on safari_itinerary_days (safari_id, display_order);

create table safari_photos (
  id            uuid primary key default gen_random_uuid(),
  safari_id     uuid not null references safari_packages(id) on delete cascade,
  storage_path  text not null,
  alt_text      text,
  display_order int not null default 0,
  is_cover      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index safari_photos_safari_idx on safari_photos (safari_id, display_order);
create unique index safari_photos_one_cover_idx on safari_photos (safari_id) where is_cover;

create table safari_enquiries (
  id                   uuid primary key default gen_random_uuid(),
  reference            text not null unique,
  safari_id            uuid references safari_packages(id) on delete set null,
  safari_name_snapshot text not null,
  guest_id             uuid references guests(id) on delete set null,
  name                 text not null,
  email                text not null,
  phone                text,
  whatsapp             text,
  travel_date          date,
  date_flexible        boolean not null default false,
  adults               int not null default 1,
  children             int not null default 0,
  travellers           int not null default 1,
  special_requests     text,
  status               enquiry_status not null default 'new',
  quoted_amount        numeric(12,2),
  currency             text not null default 'USD',
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index safari_enquiries_status_idx on safari_enquiries (status, created_at desc);
create trigger safari_enquiries_updated_at before update on safari_enquiries
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Transfers
-- ---------------------------------------------------------------------
create table transfer_services (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  short_description  text,
  full_description   text,
  service_type       text not null default 'Airport Transfer',
  pickup_locations   text[] not null default '{}',
  dropoff_locations  text[] not null default '{}',
  vehicle_type       text,
  passenger_capacity int not null default 4,
  luggage_capacity   int not null default 2,
  journey_time       text,
  pricing_method     pricing_method not null default 'fixed',
  price              numeric(12,2) not null default 0,
  currency           text not null default 'KES',
  included           text[] not null default '{}',
  excluded           text[] not null default '{}',
  additional_charges text[] not null default '{}',
  status             content_status not null default 'draft',
  display_order      int not null default 0,
  is_featured        boolean not null default false,
  seo_title          text,
  seo_description    text,
  og_image_path      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index transfer_services_status_idx on transfer_services (status);
create trigger transfer_services_updated_at before update on transfer_services
  for each row execute function set_updated_at();

create table transfer_photos (
  id            uuid primary key default gen_random_uuid(),
  transfer_id   uuid not null references transfer_services(id) on delete cascade,
  storage_path  text not null,
  alt_text      text,
  display_order int not null default 0,
  is_cover      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index transfer_photos_transfer_idx on transfer_photos (transfer_id, display_order);
create unique index transfer_photos_one_cover_idx on transfer_photos (transfer_id) where is_cover;

create table vehicles (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  registration     text not null unique,
  vehicle_type     text not null default 'Saloon',
  capacity         int not null default 4,
  luggage_capacity int not null default 2,
  status           resource_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger vehicles_updated_at before update on vehicles
  for each row execute function set_updated_at();

create table drivers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  phone        text not null,
  whatsapp     text,
  email        text,
  photo_path   text,
  licence_no   text,
  vehicle_id   uuid references vehicles(id) on delete set null,
  status       resource_status not null default 'active',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger drivers_updated_at before update on drivers
  for each row execute function set_updated_at();

create table transfer_bookings (
  id                     uuid primary key default gen_random_uuid(),
  reference              text not null unique,
  transfer_id            uuid references transfer_services(id) on delete set null,
  transfer_name_snapshot text not null,
  guest_id               uuid references guests(id) on delete set null,

  passenger_name         text not null,
  email                  text not null,
  phone                  text,
  whatsapp               text,

  pickup_location        text not null,
  dropoff_location       text not null,
  transfer_date          date not null,
  pickup_time            time,
  passengers             int not null default 1 check (passengers > 0),
  luggage                int not null default 0,
  flight_number          text,
  train_number           text,
  special_instructions   text,

  driver_id              uuid references drivers(id) on delete set null,
  vehicle_id             uuid references vehicles(id) on delete set null,

  pricing_method_snapshot pricing_method not null default 'fixed',
  unit_price_snapshot    numeric(12,2) not null default 0,
  price_snapshot         numeric(12,2) not null default 0,
  currency               text not null default 'KES',
  amount_paid            numeric(12,2) not null default 0,
  balance                numeric(12,2) generated always as (price_snapshot - amount_paid) stored,
  payment_method         text,
  payment_reference      text,

  payment_status         payment_status not null default 'unpaid',
  booking_status         transfer_status not null default 'pending',
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index transfer_bookings_date_idx on transfer_bookings (transfer_date);
create index transfer_bookings_status_idx on transfer_bookings (booking_status, created_at desc);
create trigger transfer_bookings_updated_at before update on transfer_bookings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Messages (contact form)
-- ---------------------------------------------------------------------
create table messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text,
  message    text not null,
  status     message_status not null default 'unread',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index messages_status_idx on messages (status, created_at desc);
create trigger messages_updated_at before update on messages
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Activity log (dashboard "recent activity")
-- ---------------------------------------------------------------------
create table activity_log (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null,
  title       text not null,
  detail      text,
  entity_type text,
  entity_id   uuid,
  created_at  timestamptz not null default now()
);
create index activity_log_created_idx on activity_log (created_at desc);

-- ---------------------------------------------------------------------
-- Site settings (single row)
-- ---------------------------------------------------------------------
create table site_settings (
  id                      boolean primary key default true check (id),

  property_name           text not null default 'Siriba Resort Watamu',
  tagline                 text default 'Your Coastal Escape Starts Here',
  logo_path               text,
  address                 text default 'Watamu, Kilifi County, Kenya',
  phone                   text,
  whatsapp                text,
  email                   text,
  facebook_url            text,
  instagram_url           text,
  tripadvisor_url         text,
  map_embed_url           text,

  default_currency        text not null default 'KES',
  hold_duration_hours     int not null default 3 check (hold_duration_hours >= 0),
  booking_terms           text,
  cancellation_policy     text,
  check_in_time           text default '14:00',
  check_out_time          text default '10:00',
  default_deposit_percent int not null default 30,

  hide_prices             boolean not null default false,
  usd_to_kes_rate         numeric(12,4) not null default 129.0,

  owner_email             text,
  notify_on_booking       boolean not null default true,
  notify_on_enquiry       boolean not null default true,
  notify_on_transfer      boolean not null default true,
  notify_on_message       boolean not null default true,

  pre_arrival_days        int not null default 3,
  post_stay_days          int not null default 1,
  arrival_information     text,
  review_url              text,

  updated_at              timestamptz not null default now()
);
create trigger site_settings_updated_at before update on site_settings
  for each row execute function set_updated_at();

insert into site_settings (id) values (true) on conflict do nothing;

-- ---------------------------------------------------------------------
-- Automated guest messages log (prevents duplicate sends)
-- ---------------------------------------------------------------------
create table guest_message_log (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  message_type text not null,
  sent_at      timestamptz not null default now(),
  unique (booking_id, message_type)
);
