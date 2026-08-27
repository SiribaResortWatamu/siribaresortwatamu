-- =====================================================================
-- A second logo slot, for dark backgrounds.
--
-- The header sits transparent over the homepage hero and the footer is
-- near-black, so a single dark wordmark disappears in both. The property
-- has a white variant; this gives it somewhere to live.
--
-- Both columns are overrides. Left empty, the site falls back to the
-- bundled brand files in /public, so the logo is never missing.
-- =====================================================================

alter table site_settings
  add column if not exists logo_light_path text;

comment on column site_settings.logo_path is
  'Optional override for the main logo (dark artwork, for light backgrounds). Falls back to /logo.png.';

comment on column site_settings.logo_light_path is
  'Optional override for the reversed logo (light artwork, for dark backgrounds). Falls back to /logo-light.png.';

-- The public settings reader has an explicit field list, so the new column
-- has to be added there too or the website never sees it.
create or replace function get_public_settings() returns json
language sql stable security definer set search_path = public as $fn$
  select json_build_object(
    'property_name', property_name,
    'tagline', tagline,
    'logo_path', logo_path,
    'logo_light_path', logo_light_path,
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

grant execute on function get_public_settings() to anon, authenticated;
