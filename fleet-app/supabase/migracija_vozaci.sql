-- ============================================================
-- MIGRACIJA: Vozači kao poseban modul
-- Bezbedno za pokretanje na POSTOJEĆOJ bazi - ništa ne briše.
-- ============================================================

create table if not exists vozaci (
  id uuid primary key default gen_random_uuid(),
  ime_prezime text not null,
  telefon text,
  email text,
  broj_vozacke text,
  kategorija text,          -- npr. "D, D1, DE"
  aktivan boolean not null default true,
  napomena text,
  created_at timestamptz not null default now()
);

alter table vozaci enable row level security;

drop policy if exists "authenticated_all_vozaci" on vozaci;
create policy "authenticated_all_vozaci" on vozaci
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- dokumenta tabela sada može pripadati i vozilu i vozaču (jedno od dva, ili nijedno)
alter table dokumenta add column if not exists vozac_id uuid references vozaci(id) on delete cascade;

-- vozilo može biti formalno dodeljeno vozaču (pored postojećeg tekstualnog polja "vozac"
-- koje ostaje radi kompatibilnosti sa već unetim podacima)
alter table vozila add column if not exists vozac_id uuid references vozaci(id) on delete set null;
