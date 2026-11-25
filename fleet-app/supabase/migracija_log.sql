-- ============================================================
-- MIGRACIJA: log izmena
-- Bezbedno za pokretanje na POSTOJEĆOJ bazi - ništa ne briše,
-- samo dodaje novu tabelu za istoriju izmena.
-- ============================================================

create table if not exists log_izmena (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  korisnik text,       -- email korisnika koji je izvršio izmenu
  opis text not null,  -- npr. "Izmenjeno vozilo BG1136-NU"
  tabela text,         -- npr. "vozila", "dokumenta", "putarine"
  akcija text          -- "dodavanje" / "izmena" / "brisanje"
);

alter table log_izmena enable row level security;

drop policy if exists "authenticated_all_log_izmena" on log_izmena;

create policy "authenticated_all_log_izmena" on log_izmena
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
