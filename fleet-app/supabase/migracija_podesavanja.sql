-- ============================================================
-- MIGRACIJA: Podešavanja (boje, prikaz polja, pragovi)
-- Bezbedno za pokretanje na POSTOJEĆOJ bazi - ništa ne briše.
-- Jedan deljeni red podešavanja za ceo tim (id = 'default').
-- ============================================================

create table if not exists podesavanja (
  id text primary key default 'default',
  naziv_firme text default 'Vozni park',
  akcenat_tamno text default '#f0f941',
  akcenat_svetlo text default '#0d9488',
  prag_servis_km int default 2000,
  prag_rokovi_dana int default 14,
  prikaz_vozila jsonb default '{}'::jsonb,
  prikaz_vozaci jsonb default '{}'::jsonb,
  prikaz_pregled jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table podesavanja enable row level security;

drop policy if exists "authenticated_all_podesavanja" on podesavanja;
create policy "authenticated_all_podesavanja" on podesavanja
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into podesavanja (id) values ('default') on conflict (id) do nothing;
