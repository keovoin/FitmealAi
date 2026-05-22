-- =============================================================================
-- 0010_storage_policies.sql
-- Storage policies for the two buckets you created in the dashboard:
--   meal-images (public)  -> readable by anyone, writable by service role only
--   receipts    (private) -> user uploads their own, only service role reads
--
-- Pre-req: the buckets must exist. If you didn't create them yet, run:
--   insert into storage.buckets (id, name, public) values
--     ('meal-images', 'meal-images', true),
--     ('receipts',    'receipts',    false)
--   on conflict (id) do nothing;
-- =============================================================================

-- Insert the buckets if missing. Idempotent.
insert into storage.buckets (id, name, public)
values
  ('meal-images', 'meal-images', true),
  ('receipts',    'receipts',    false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- meal-images: public read; only service role writes (AI endpoint).
-- ---------------------------------------------------------------------------
drop policy if exists "meal-images public read" on storage.objects;
create policy "meal-images public read"
  on storage.objects for select
  to public
  using (bucket_id = 'meal-images');

-- ---------------------------------------------------------------------------
-- receipts: each user uploads their own files under a folder named after
-- their user_id. They can read their own files, admin (service role) reads
-- all. Path convention enforced: 'receipts/<user_id>/<filename>'.
-- ---------------------------------------------------------------------------
drop policy if exists "receipts self upload" on storage.objects;
create policy "receipts self upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipts self read" on storage.objects;
create policy "receipts self read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
