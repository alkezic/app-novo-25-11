-- ============================================================
-- MIGRACIJA: fotografije vozila + održavanje
-- Bezbedno za pokretanje na POSTOJEĆOJ bazi - ništa ne briše,
-- samo dodaje nove tabele.
-- ============================================================

create table if not exists vozilo_fotografije (
  id uuid primary key default gen_random_uuid(),
  vozilo_id uuid references vozila(id) on delete cascade,
  fajl_url text not null,
  created_at timestamptz not null default now()
);

alter table vozilo_fotografije enable row level security;

drop policy if exists "authenticated_all_vozilo_fotografije" on vozilo_fotografije;
create policy "authenticated_all_vozilo_fotografije" on vozilo_fotografije
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create table if not exists odrzavanje (
  id uuid primary key default gen_random_uuid(),
  vozilo_id uuid references vozila(id) on delete cascade,
  datum_servisa date not null,
  kilometraza int,
  kilometraza_sledeci_servis int,
  majstor_servis text,
  opis text,
  zapazeni_kvarovi text,
  created_at timestamptz not null default now()
);

alter table odrzavanje enable row level security;

drop policy if exists "authenticated_all_odrzavanje" on odrzavanje;
create policy "authenticated_all_odrzavanje" on odrzavanje
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
