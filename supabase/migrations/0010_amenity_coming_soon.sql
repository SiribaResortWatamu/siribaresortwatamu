-- Amenities that are planned or still being built. They stay visible on the
-- site, marked "Coming soon", instead of being hidden or promised as if
-- they were already in place.
alter table amenities add column if not exists is_coming_soon boolean not null default false;
