-- Stage 3: prescriptions storage bucket + RLS. Run in the Supabase SQL editor.
-- Idempotent — safe to run more than once.

-- ── Private bucket ───────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prescriptions', 'prescriptions', false,
  10485760,                                            -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Storage object policies ──────────────────────────────────────────────
-- Files live under <user_id>/<filename>; users manage only their own folder.
drop policy if exists "prescriptions upload own" on storage.objects;
create policy "prescriptions upload own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'prescriptions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "prescriptions read own" on storage.objects;
create policy "prescriptions read own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'prescriptions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "prescriptions staff read all" on storage.objects;
create policy "prescriptions staff read all"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'prescriptions'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('pharmacist', 'admin')
    )
  );

-- ── prescriptions table policies ─────────────────────────────────────────
alter table public.prescriptions enable row level security;

drop policy if exists "prescriptions insert own" on public.prescriptions;
create policy "prescriptions insert own"
  on public.prescriptions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "prescriptions read own" on public.prescriptions;
create policy "prescriptions read own"
  on public.prescriptions for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "prescriptions staff read all" on public.prescriptions;
create policy "prescriptions staff read all"
  on public.prescriptions for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('pharmacist', 'admin')
    )
  );

drop policy if exists "prescriptions staff update" on public.prescriptions;
create policy "prescriptions staff update"
  on public.prescriptions for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('pharmacist', 'admin')
    )
  );
