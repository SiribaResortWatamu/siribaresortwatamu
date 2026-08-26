-- Siriba Resort — initial schema (Firebase -> Supabase migration, Phase 2)
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE / ON CONFLICT).

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist"; -- exclusion constraint on bookings

-- ============================================================================
-- APARTMENTS
-- ============================================================================
create table if not exists apartments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  features jsonb not null default '[]',           -- [{ icon: "fa-bed", text: "3 Bedrooms" }, ...]
  price_usd numeric(10, 2) not null,
  guests int not null default 2,
  bedrooms int not null default 1,
  bathrooms int not null default 1,
  is_archived boolean not null default false,
  feature_on_homepage boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists apartment_photos (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references apartments(id) on delete cascade,
  storage_path text not null,
  "order" int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists one_cover_per_apartment
  on apartment_photos (apartment_id)
  where is_cover;

create index if not exists apartment_photos_apartment_id_idx
  on apartment_photos (apartment_id, "order");

-- ============================================================================
-- BOOKINGS (apartment reservations)
-- ============================================================================
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references apartments(id),
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  arrival date not null,
  departure date not null,
  adults int not null default 1,
  children int not null default 0,
  nights int generated always as (departure - arrival) stored,
  price_per_night_usd numeric(10, 2) not null,
  total_price_usd numeric(10, 2) not null,
  special_requests text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  source text not null default 'site' check (source in ('site', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departure_after_arrival check (departure > arrival)
);

-- Prevents two non-cancelled bookings for the same apartment from overlapping,
-- enforced atomically by Postgres (not just app-level checks).
alter table bookings drop constraint if exists no_overlapping_bookings;
alter table bookings add constraint no_overlapping_bookings
  exclude using gist (
    apartment_id with =,
    daterange(arrival, departure, '[)') with &&
  ) where (status <> 'cancelled');

create index if not exists bookings_apartment_id_idx on bookings (apartment_id);

-- ============================================================================
-- SAFARIS
-- ============================================================================
create table if not exists safari_packages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  duration_label text,
  description text not null default '',
  price_usd numeric(10, 2),           -- nullable: current safaris have no set price ("contact us")
  images jsonb not null default '[]', -- simple array of image URLs, no ordering/cover metadata
  is_archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists safari_bookings (
  id uuid primary key default gen_random_uuid(),
  safari_package_id uuid references safari_packages(id),
  safari_name text not null, -- denormalized snapshot, survives package archive/rename
  guest_name text not null,
  guest_email text not null,
  travel_date date,
  adults int not null default 1,
  children int not null default 0,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- CONTACT MESSAGES
-- ============================================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- BLOCKED DATES (manual maintenance/owner blocks, independent of bookings)
-- ============================================================================
create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid references apartments(id), -- null = applies to ALL apartments
  start_date date not null,
  end_date date not null,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_date >= start_date)
);

-- ============================================================================
-- SITE SETTINGS (singleton row)
-- ============================================================================
create table if not exists site_settings (
  id smallint primary key default 1 check (id = 1),
  show_prices boolean not null default true,
  usd_to_kes_rate numeric not null default 130
);
insert into site_settings (id) values (1) on conflict (id) do nothing;

-- ============================================================================
-- GUEST-SAFE AVAILABILITY VIEW
-- Exposes only apartment_id + date range from non-cancelled bookings (no PII),
-- so the public calendar can show taken dates without any anon access to the
-- `bookings` table itself.
-- ============================================================================
create or replace view public_apartment_unavailability as
  select apartment_id, arrival as start_date, departure as end_date
  from bookings
  where status <> 'cancelled';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table apartments enable row level security;
alter table apartment_photos enable row level security;
alter table safari_packages enable row level security;
alter table bookings enable row level security;
alter table safari_bookings enable row level security;
alter table messages enable row level security;
alter table blocked_dates enable row level security;
alter table site_settings enable row level security;

-- apartments: public sees active only; admins see everything; admin-only writes
drop policy if exists "public read active apartments" on apartments;
create policy "public read active apartments" on apartments
  for select to anon, authenticated using (is_archived = false);

drop policy if exists "admin read all apartments" on apartments;
create policy "admin read all apartments" on apartments
  for select to authenticated using (true);

drop policy if exists "admin write apartments" on apartments;
create policy "admin write apartments" on apartments
  for all to authenticated using (true) with check (true);

-- apartment_photos: public read (needed for gallery), admin-only write
drop policy if exists "public read apartment photos" on apartment_photos;
create policy "public read apartment photos" on apartment_photos
  for select to anon, authenticated using (true);

drop policy if exists "admin write apartment photos" on apartment_photos;
create policy "admin write apartment photos" on apartment_photos
  for all to authenticated using (true) with check (true);

-- safari_packages: same pattern as apartments
drop policy if exists "public read active safaris" on safari_packages;
create policy "public read active safaris" on safari_packages
  for select to anon, authenticated using (is_archived = false);

drop policy if exists "admin read all safaris" on safari_packages;
create policy "admin read all safaris" on safari_packages
  for select to authenticated using (true);

drop policy if exists "admin write safaris" on safari_packages;
create policy "admin write safaris" on safari_packages
  for all to authenticated using (true) with check (true);

-- bookings / safari_bookings / messages: NO anon access at all.
-- Public inserts happen server-side via a service-role key (Route Handlers),
-- after the server validates/recomputes price — this is what fixes the old
-- Firestore bug where a client could submit any totalPrice/status directly.
drop policy if exists "admin manage bookings" on bookings;
create policy "admin manage bookings" on bookings
  for all to authenticated using (true) with check (true);

drop policy if exists "admin manage safari bookings" on safari_bookings;
create policy "admin manage safari bookings" on safari_bookings
  for all to authenticated using (true) with check (true);

drop policy if exists "admin manage messages" on messages;
create policy "admin manage messages" on messages
  for all to authenticated using (true) with check (true);

-- blocked_dates: public read (guest calendar needs it), admin-only write
drop policy if exists "public read blocked dates" on blocked_dates;
create policy "public read blocked dates" on blocked_dates
  for select to anon, authenticated using (true);

drop policy if exists "admin write blocked dates" on blocked_dates;
create policy "admin write blocked dates" on blocked_dates
  for all to authenticated using (true) with check (true);

-- site_settings: public read, admin-only update
drop policy if exists "public read site settings" on site_settings;
create policy "public read site settings" on site_settings
  for select to anon, authenticated using (true);

drop policy if exists "admin update site settings" on site_settings;
create policy "admin update site settings" on site_settings
  for update to authenticated using (true) with check (true);

-- The unavailability view inherits querying-user privileges from `bookings`
-- (Postgres views run with the querying role's RLS by default here since we
-- did not mark it security_definer), so grant anon explicit SELECT on it.
grant select on public_apartment_unavailability to anon, authenticated;

-- ============================================================================
-- SEED DATA — the 6 real apartments, ported verbatim from the old site's
-- accommodation.html / room-details.html (fresh start: no Firebase data
-- migrated, this is retyped from the live content).
-- ============================================================================
insert into apartments (slug, name, description, features, price_usd, guests, bedrooms, bathrooms, feature_on_homepage, sort_order)
values
  (
    'platinum',
    'Platinum Penthouse',
    'The epitome of coastal luxury with expansive living areas and unparalleled breathtaking views. Enjoy maximum comfort in our top-tier penthouse designed for the ultimate relaxation. Features an exclusive pagola and luxurious furnishings.',
    '[
      {"icon": "fa-bed", "text": "3 Bedrooms (All en-suite)"},
      {"icon": "fa-bath", "text": "3 Bathrooms"},
      {"icon": "fa-kitchen-set", "text": "Fully Equipped Kitchen"},
      {"icon": "fa-umbrella-beach", "text": "Private Pagola"},
      {"icon": "fa-wifi", "text": "High-Speed Wi-Fi"},
      {"icon": "fa-tv", "text": "Smart TVs"},
      {"icon": "fa-wind", "text": "Central Air Conditioning"}
    ]'::jsonb,
    450, 6, 3, 3, true, 1
  ),
  (
    'pearl',
    'Pearl Studio',
    'A chic space featuring modern decor, perfect for couples looking for an intimate retreat. This beautifully appointed studio combines elegance and practicality with a warm, pearl-inspired aesthetic.',
    '[
      {"icon": "fa-bed", "text": "1 King Size Bed"},
      {"icon": "fa-bath", "text": "1 Bathroom"},
      {"icon": "fa-wifi", "text": "Free High-Speed Wi-Fi"},
      {"icon": "fa-tv", "text": "Smart TV"},
      {"icon": "fa-wind", "text": "Air Conditioning"}
    ]'::jsonb,
    150, 2, 1, 1, true, 2
  ),
  (
    'sapphire',
    'Sapphire Apartment',
    'Spacious luxury offering a beautiful living area and fully-equipped kitchen. Decorated with subtle sapphire blue tones, reflecting the beauty of the Watamu ocean.',
    '[
      {"icon": "fa-bed", "text": "2 Bedrooms (1 En-suite)"},
      {"icon": "fa-bath", "text": "2 Bathrooms"},
      {"icon": "fa-sink", "text": "Kitchenette"},
      {"icon": "fa-wind", "text": "Air Conditioning"},
      {"icon": "fa-wifi", "text": "Free Wi-Fi"}
    ]'::jsonb,
    250, 4, 2, 2, false, 3
  ),
  (
    'ruby',
    'Ruby Apartment',
    'Elegant design with a vibrant atmosphere, ideal for families and small groups. Ruby offers a warm and inviting space with top-end amenities to make your stay unforgettable.',
    '[
      {"icon": "fa-bed", "text": "2 Bedrooms (1 En-suite)"},
      {"icon": "fa-bath", "text": "2 Bathrooms"},
      {"icon": "fa-sink", "text": "Kitchen"},
      {"icon": "fa-wind", "text": "Air Conditioning"},
      {"icon": "fa-couch", "text": "Spacious Lounge"}
    ]'::jsonb,
    250, 4, 2, 2, false, 4
  ),
  (
    'gold',
    'Gold Apartment',
    'Luxurious gold accents and premium comfort for an unforgettable coastal getaway. Elegantly styled for guests who appreciate a touch of glamour.',
    '[
      {"icon": "fa-bed", "text": "2 Bedrooms (1 En-suite)"},
      {"icon": "fa-bath", "text": "2 Bathrooms"},
      {"icon": "fa-sink", "text": "Premium Kitchen"},
      {"icon": "fa-wind", "text": "Air Conditioning"},
      {"icon": "fa-star", "text": "Premium Decor"}
    ]'::jsonb,
    300, 4, 2, 2, false, 5
  ),
  (
    'diamond',
    'Diamond Apartment',
    'The pinnacle of our 2-bedroom offerings, featuring brilliant design and radiant comfort. Experience clarity and luxury with expansive views and high-end finishes throughout.',
    '[
      {"icon": "fa-bed", "text": "2 Bedrooms (1 En-suite)"},
      {"icon": "fa-bath", "text": "2 Bathrooms"},
      {"icon": "fa-sink", "text": "Gourmet Kitchen"},
      {"icon": "fa-wind", "text": "Air Conditioning"},
      {"icon": "fa-gem", "text": "Luxury Finishes"},
      {"icon": "fa-water", "text": "Ocean Views"}
    ]'::jsonb,
    350, 4, 2, 2, true, 6
  )
on conflict (slug) do nothing;

-- ============================================================================
-- SEED DATA — safari packages. Only the 4 that had real content defined in
-- the old site's safari-details.html `safariData` object are seeded (the
-- other 5 links on safaris.html pointed at slugs with no backing data, i.e.
-- they were already broken/unfinished on the old site — not carried over).
-- No price data exists on the old site for safaris (contact-to-book model),
-- so price_usd is left null.
-- ============================================================================
insert into safari_packages (slug, name, duration_label, description, price_usd, sort_order)
values
  (
    '7-days-mara-nakuru-amboseli-tsavo',
    '7 Days Masai Mara, Lake Nakuru, Amboseli & Tsavo East',
    '7 Days / 6 Nights',
    'Embark on an unforgettable 7-day Kenyan journey. Witness the Great Migration in Masai Mara, marvel at the flamingos and rhinos in Lake Nakuru, enjoy the stunning backdrop of Mount Kilimanjaro in Amboseli, and experience the vast wilderness of Tsavo East. This comprehensive safari offers the ultimate wildlife experience.',
    null, 1
  ),
  (
    '5-days-mara-nakuru-amboseli',
    '5 Days Masai Mara, Lake Nakuru & Amboseli',
    '5 Days / 4 Nights',
    'A concentrated 5-day adventure taking you through Kenya''s most premium parks. From the rolling savannahs of the Mara to the soda lake of Nakuru and the elephant-rich plains of Amboseli.',
    null, 2
  ),
  (
    '4-days-tsavo-east-west-amboseli',
    '4 Days Tsavo East, Tsavo West & Amboseli',
    '4 Days / 3 Nights',
    'Perfect for guests staying at our resort! Depart from Watamu to explore the massive Tsavo parks, featuring red elephants, Mzima springs, and proceed to Amboseli for views of Kilimanjaro.',
    null, 3
  ),
  (
    'amazing-kenya-safari-adventure',
    'Amazing Kenya Safari Adventure',
    'Custom',
    'Experience an incredible safari tailored for you. Get in touch with us to arrange the specifics.',
    null, 4
  )
on conflict (slug) do nothing;
