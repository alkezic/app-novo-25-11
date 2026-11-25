-- ============================================================
-- MIGRACIJA: Istek registracije kao posebno polje vozila
-- (odvojeno od dokumenta "Saobraćajna dozvola", koji ostaje
-- samo kao fajl bez roka vezanog za njega)
-- Bezbedno za pokretanje na POSTOJEĆOJ bazi.
-- ============================================================

alter table vozila add column if not exists istek_registracije date;

-- Prebacuje postojeće datume isteka sa dokumenata tipa "registracija"
-- na novo polje kod vozila (uzima najnoviji ako ih ima više).
update vozila v
set istek_registracije = sub.max_datum
from (
  select vozilo_id, max(datum_isteka) as max_datum
  from dokumenta
  where tip = 'registracija' and datum_isteka is not null
  group by vozilo_id
) sub
where sub.vozilo_id = v.id;

-- Datum isteka na samom dokumentu više se ne koristi (rok se sada
-- prati na vozilu) - čisti se da ne postoje dva izvora iste informacije.
update dokumenta set datum_isteka = null where tip = 'registracija';
