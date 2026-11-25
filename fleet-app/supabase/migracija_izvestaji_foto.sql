-- ============================================================
-- MIGRACIJA: Izveštaji + izbor glavne fotografije
-- Bezbedno za pokretanje na POSTOJEĆOJ bazi - ništa ne briše.
-- ============================================================

create table if not exists izvestaji (
  id uuid primary key default gen_random_uuid(),
  naziv text not null,
  vozila_id uuid[],        -- null = sva vozila
  polja jsonb not null default '{}'::jsonb,
  kreirao text,
  created_at timestamptz not null default now()
);

alter table izvestaji enable row level security;

drop policy if exists "authenticated_all_izvestaji" on izvestaji;
create policy "authenticated_all_izvestaji" on izvestaji
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Ručni izbor koja je fotografija "glavna" (umesto da to uvek bude prva otpremljena)
alter table vozilo_fotografije add column if not exists glavna boolean not null default false;
