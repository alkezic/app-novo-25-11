-- ============================================================
-- MIGRACIJA: Finansije (Izdati/Primljeni računi, Uplate/Isplate,
-- automatsko rasknjižavanje)
-- NAPOMENA: ovo BRIŠE i pravi iznova tabele racuni/placanja jer
-- taj deo aplikacije nikad nije bio aktivno korišćen (bio je
-- posivljen u meniju od početka). Ako si u međuvremenu ipak
-- uneo/la nešto u te tabele, javi mi PRE pokretanja ove migracije.
-- ============================================================

drop view if exists v_racuni_stanje;
drop view if exists v_placanja_stanje;
drop table if exists raspodele_uplata cascade;
drop table if exists placanja cascade;
drop table if exists racuni cascade;

-- ------------------------------------------------------------
-- BANKOVNI RAČUNI (naši računi u bankama)
-- ------------------------------------------------------------
create table if not exists banke_racuni (
  id uuid primary key default gen_random_uuid(),
  naziv text not null,       -- npr. "Raiffeisen tekući"
  banka text,
  broj_racuna text,          -- IBAN
  valuta text not null default 'RSD',
  napomena text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- RAČUNI (izdati i primljeni - jedna tabela, razlikuju se po "tip")
-- Status i preostalo NIKAD nisu ovde - uvek se računaju iz
-- raspodele_uplata preko v_racuni_stanje.
-- ------------------------------------------------------------
create table racuni (
  id uuid primary key default gen_random_uuid(),
  tip text not null check (tip in ('izlazni','ulazni')),
  broj_racuna text,                    -- za izlazne: auto-generisan (vidi funkciju ispod); za ulazne: slobodan unos
  partner_id uuid references partneri(id),
  vozilo_id uuid references vozila(id),
  iznos numeric(14,2) not null,
  valuta text not null default 'RSD',
  kurs numeric(14,6) not null default 1,   -- kurs u odnosu na osnovnu valutu (RSD) na dan izdavanja
  pdv_osnovica numeric(14,2),              -- opciono - popuni ako vodiš PDV evidenciju
  pdv_stopa numeric(5,2),
  pdv_iznos numeric(14,2),
  datum_izdavanja date not null,
  datum_valute date,                       -- rok plaćanja / dospeće
  opis text,
  fajl_url text,
  storniran boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PLAĆANJA (uplate nama i naše isplate dobavljačima)
-- ------------------------------------------------------------
create table placanja (
  id uuid primary key default gen_random_uuid(),
  tip text not null check (tip in ('primljena','poslata')),
  partner_id uuid references partneri(id),
  banka_racun_id uuid references banke_racuni(id),
  datum date not null,
  iznos numeric(14,2) not null,
  valuta text not null default 'RSD',
  kurs numeric(14,6) not null default 1,
  referenca text,             -- broj izvoda / referenca banke
  napomena text,
  storniran boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- RASPODELE UPLATA (ključna tabela - many-to-many uplata <-> računi)
-- ------------------------------------------------------------
create table raspodele_uplata (
  id uuid primary key default gen_random_uuid(),
  placanje_id uuid references placanja(id) on delete cascade,
  racun_id uuid references racuni(id) on delete cascade,
  iznos numeric(14,2) not null,     -- iznos raspoređen na taj račun, u valuti računa
  kurs_koriscen numeric(14,6) not null default 1,  -- kurs po kom je ova raspodela knjižena (istorijski snapshot)
  kreirao text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Automatska numeracija izlaznih računa: GGGG-NNN
-- ------------------------------------------------------------
create sequence if not exists seq_broj_izlaznog_racuna;

create or replace function sledeci_broj_izlaznog_racuna()
returns text as $$
declare
  godina text := to_char(now(), 'YYYY');
  broj int;
begin
  select count(*) + 1 into broj
  from racuni
  where tip = 'izlazni' and broj_racuna like godina || '-%';
  return godina || '-' || lpad(broj::text, 3, '0');
end;
$$ language plpgsql;

grant execute on function sledeci_broj_izlaznog_racuna() to authenticated;

-- ------------------------------------------------------------
-- VIEW: stanje svakog računa (plaćeno / preostalo / status) -
-- izračunato, nikad ručno upisano
-- ------------------------------------------------------------
create or replace view v_racuni_stanje as
select
  r.*,
  coalesce(sum(ru.iznos), 0) as placeno,
  r.iznos - coalesce(sum(ru.iznos), 0) as preostalo,
  case
    when r.storniran then 'storniran'
    when coalesce(sum(ru.iznos), 0) >= r.iznos then 'placeno'
    when coalesce(sum(ru.iznos), 0) > 0 then 'delimicno'
    else 'neplaceno'
  end as status,
  case
    when not r.storniran and coalesce(sum(ru.iznos), 0) < r.iznos
         and r.datum_valute is not null and r.datum_valute < current_date
    then (current_date - r.datum_valute)
    else null
  end as dana_kasnjenja
from racuni r
left join raspodele_uplata ru on ru.racun_id = r.id
group by r.id;

-- ------------------------------------------------------------
-- VIEW: stanje svake uplate (raspoređeno / neraspoređeno)
-- ------------------------------------------------------------
create or replace view v_placanja_stanje as
select
  p.*,
  coalesce(sum(ru.iznos), 0) as rasporedjeno,
  p.iznos - coalesce(sum(ru.iznos), 0) as neraspodeljeno
from placanja p
left join raspodele_uplata ru on ru.placanje_id = p.id
group by p.id;

grant select on v_racuni_stanje to authenticated;
grant select on v_placanja_stanje to authenticated;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table banke_racuni enable row level security;
alter table racuni enable row level security;
alter table placanja enable row level security;
alter table raspodele_uplata enable row level security;

drop policy if exists "authenticated_all_banke_racuni" on banke_racuni;
create policy "authenticated_all_banke_racuni" on banke_racuni
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_all_racuni" on racuni;
create policy "authenticated_all_racuni" on racuni
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_all_placanja" on placanja;
create policy "authenticated_all_placanja" on placanja
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_all_raspodele_uplata" on raspodele_uplata;
create policy "authenticated_all_raspodele_uplata" on raspodele_uplata
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Indeksi
-- ------------------------------------------------------------
create index if not exists idx_racuni_partner_id on racuni(partner_id);
create index if not exists idx_racuni_tip on racuni(tip);
create index if not exists idx_racuni_datum_valute on racuni(datum_valute);
create index if not exists idx_placanja_partner_id on placanja(partner_id);
create index if not exists idx_raspodele_placanje_id on raspodele_uplata(placanje_id);
create index if not exists idx_raspodele_racun_id on raspodele_uplata(racun_id);
