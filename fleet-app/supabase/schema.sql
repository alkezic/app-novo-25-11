-- ============================================================
-- FLEET APP - šema baze (v2 - prilagođeno stvarnoj evidenciji)
-- Pokreni ovo u Supabase Dashboard -> SQL Editor -> New query
-- Bezbedno za pokretanje i na praznoj i na već postojećoj bazi
-- (briše i pravi tabele iznova - koristi se dok je baza prazna/testna)
-- ============================================================

create extension if not exists "pgcrypto";

drop table if exists placanja cascade;
drop table if exists racuni cascade;
drop table if exists putarine cascade;
drop table if exists dokumenta cascade;
drop table if exists vozila cascade;
drop table if exists partneri cascade;
drop table if exists vozaci cascade;

-- ------------------------------------------------------------
-- VOZAČI
-- ------------------------------------------------------------
create table vozaci (
  id uuid primary key default gen_random_uuid(),
  ime_prezime text not null,
  telefon text,
  email text,
  broj_vozacke text,
  kategorija text,
  aktivan boolean not null default true,
  napomena text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- VOZILA
-- ------------------------------------------------------------
create table vozila (
  id uuid primary key default gen_random_uuid(),
  registracija text not null,
  marka_tip text not null,               -- npr. "DAF AXIAL 50 II"
  godina int,
  vin text,                               -- broj šasije
  broj_sedista int,
  vrsta_vozila text,                      -- autobus / minibus / kombi / kamion / ...
  aktivno boolean not null default true,  -- da li je vozilo trenutno u floti/upotrebi
  u_voznom_parku text,                    -- status licence Ministarstva: DA / NE / ...
  vlasnistvo text,                        -- sopstveno / lizing
  lizing_br_ugovora text,
  vozac text,
  vozac_id uuid references vozaci(id) on delete set null,
  istek_registracije date,                -- rok registracije - obnavlja se godišnje, odvojeno od dokumenta "Saobraćajna dozvola"
  napomena text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PARTNERI (kupci, dobavljači, servisi, osiguravajuće kuće...)
-- ------------------------------------------------------------
create table partneri (
  id uuid primary key default gen_random_uuid(),
  naziv text not null,
  pib text,
  kontakt text,
  napomena text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- DOKUMENTA (registracija, kasko, staklo, AO, tehnički pregled...)
-- svaki tip osiguranja/dokumenta je poseban red, može ih biti
-- proizvoljno mnogo po vozilu (istorija kroz godine)
-- ------------------------------------------------------------
create table dokumenta (
  id uuid primary key default gen_random_uuid(),
  vozilo_id uuid references vozila(id) on delete cascade,
  vozac_id uuid references vozaci(id) on delete cascade,
  tip text not null,           -- registracija / kasko / staklo / AO / tehnički pregled / servisna knjiga / ostalo
  broj text,                   -- broj polise / broj dokumenta
  izdavalac text,              -- osiguravajuća kuća / institucija koja je izdala dokument
  datum_izdavanja date,
  datum_isteka date,
  fajl_url text,
  napomena text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PUTARINE (TAG uređaji po vozilu i po zemlji)
-- ------------------------------------------------------------
create table putarine (
  id uuid primary key default gen_random_uuid(),
  vozilo_id uuid references vozila(id) on delete cascade,
  zemlja text not null,        -- Srbija / Mađarska / ...
  broj_taga text,
  napomena text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- RAČUNI (izlazni = mi izdajemo, ulazni = mi primamo)
-- ------------------------------------------------------------
create table racuni (
  id uuid primary key default gen_random_uuid(),
  tip text not null check (tip in ('izlazni','ulazni')),
  broj_racuna text,
  partner_id uuid references partneri(id),
  vozilo_id uuid references vozila(id),
  iznos numeric(12,2) not null,
  valuta text not null default 'RSD',
  datum_izdavanja date not null,
  rok_placanja date,
  status text not null default 'neplaceno', -- neplaceno / delimicno / placeno
  opis text,
  fajl_url text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PLAĆANJA (uplate/isplate vezane za račun)
-- ------------------------------------------------------------
create table placanja (
  id uuid primary key default gen_random_uuid(),
  racun_id uuid references racuni(id) on delete cascade,
  iznos numeric(12,2) not null,
  datum date not null,
  nacin text,
  napomena text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- FOTOGRAFIJE VOZILA
-- ------------------------------------------------------------
create table vozilo_fotografije (
  id uuid primary key default gen_random_uuid(),
  vozilo_id uuid references vozila(id) on delete cascade,
  fajl_url text not null,
  glavna boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ODRŽAVANJE (servisi, popravke)
-- ------------------------------------------------------------
create table odrzavanje (
  id uuid primary key default gen_random_uuid(),
  vozilo_id uuid references vozila(id) on delete cascade,
  datum_servisa date not null,
  tip_servisa text not null default 'redovan' check (tip_servisa in ('redovan', 'vanredni')),
  kilometraza int,
  kilometraza_sledeci_servis int,
  majstor_servis text,
  opis text,
  zapazeni_kvarovi text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- IZVEŠTAJI (sačuvani prilagođeni izveštaji)
-- ------------------------------------------------------------
create table izvestaji (
  id uuid primary key default gen_random_uuid(),
  naziv text not null,
  vozila_id uuid[],
  polja jsonb not null default '{}'::jsonb,
  kreirao text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- LOG IZMENA (istorija svih promena u aplikaciji)
-- ------------------------------------------------------------
create table log_izmena (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  korisnik text,
  opis text not null,
  tabela text,
  akcija text
);

-- ------------------------------------------------------------
-- RLS: pristup samo prijavljenim korisnicima (deljeni podaci tima)
-- ------------------------------------------------------------
alter table vozila enable row level security;
alter table partneri enable row level security;
alter table dokumenta enable row level security;
alter table putarine enable row level security;
alter table racuni enable row level security;
alter table placanja enable row level security;
alter table log_izmena enable row level security;
alter table vozilo_fotografije enable row level security;
alter table odrzavanje enable row level security;
alter table vozaci enable row level security;
alter table izvestaji enable row level security;

create policy "authenticated_all_vozila" on vozila
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_partneri" on partneri
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_dokumenta" on dokumenta
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_putarine" on putarine
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_racuni" on racuni
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_placanja" on placanja
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_log_izmena" on log_izmena
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_vozilo_fotografije" on vozilo_fotografije
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_odrzavanje" on odrzavanje
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_vozaci" on vozaci
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_izvestaji" on izvestaji
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- STORAGE bucket za skenirane dokumente / fakture (privatan)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('dokumenti', 'dokumenti', false)
on conflict (id) do nothing;

drop policy if exists "authenticated_read_dokumenti" on storage.objects;
drop policy if exists "authenticated_write_dokumenti" on storage.objects;
drop policy if exists "authenticated_delete_dokumenti" on storage.objects;

create policy "authenticated_read_dokumenti" on storage.objects
  for select using (bucket_id = 'dokumenti' and auth.role() = 'authenticated');

create policy "authenticated_write_dokumenti" on storage.objects
  for insert with check (bucket_id = 'dokumenti' and auth.role() = 'authenticated');

create policy "authenticated_delete_dokumenti" on storage.objects
  for delete using (bucket_id = 'dokumenti' and auth.role() = 'authenticated');
