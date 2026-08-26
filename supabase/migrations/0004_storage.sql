-- =====================================================================
-- Siriba Resort Watamu — Storage buckets
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may read the media bucket (it backs the public website).
create policy media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'media');

-- Only admins may upload, replace or remove media.
create policy media_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and is_admin());

create policy media_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and is_admin())
  with check (bucket_id = 'media' and is_admin());

create policy media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and is_admin());
