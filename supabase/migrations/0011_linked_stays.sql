-- Linked stays: separate bookings that belong to one guest's visit, such as
-- 28 Dec and then 31 Dec to 2 Jan. Bookings sharing a stay_group_id are
-- linked; each stays an ordinary booking with its own dates, price and
-- payments, so availability and the no-overlap rule are unaffected.
alter table bookings add column if not exists stay_group_id uuid;

create index if not exists bookings_stay_group_idx
  on bookings (stay_group_id) where stay_group_id is not null;
