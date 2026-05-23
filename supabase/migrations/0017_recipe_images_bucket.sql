-- =============================================================================
-- 0017_recipe_images_bucket.sql
-- A public Supabase Storage bucket for recipe hero/thumbnail imagery,
-- parallel to the `meal-images` bucket created in 0010.
--
-- Used by:
--   - Admin "upload image" file picker on /recipes/[id] and /recipes/new
--     (uploads via service-role key from a Next.js server action).
--   - Admin "Generate with AI" panel, which calls the OpenAI Images API
--     and uploads the resulting PNG to this bucket.
--
-- The mobile app reads `recipes.image_url` directly; that URL points at
-- this bucket's public CDN, so no special policy is needed for clients.
--
-- Idempotent on re-run.
-- =============================================================================

-- Create the bucket if it doesn't already exist.
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Public read: anyone can fetch <project>.supabase.co/storage/v1/object/public/recipe-images/<key>.
-- Writes are restricted to the service role (admin-side only). The
-- mobile app never writes to this bucket.
-- ---------------------------------------------------------------------------
drop policy if exists "recipe-images public read" on storage.objects;
create policy "recipe-images public read"
  on storage.objects for select
  to public
  using (bucket_id = 'recipe-images');
