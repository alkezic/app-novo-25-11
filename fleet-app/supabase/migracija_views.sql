-- ============================================================
-- MIGRACIJA: view-ovi za dashboard
-- Bezbedno za pokretanje na POSTOJEĆOJ bazi - ništa ne briše.
-- Prebacuje računanje "blizu servisa" sa klijenta na bazu, tako
-- da se sa servera povlači samo gotov rezultat, a ne sve
-- istorijske stavke servisa za svako vozilo.
-- ============================================================

create or replace view v_status_servisa as
select
  v.id as vozilo_id,
  v.registracija,
  v.marka_tip,
  najnoviji.kilometraza as trenutna_km,
  poslednji_redovan.kilometraza_sledeci_servis as cilj_km,
  case
    when poslednji_redovan.kilometraza_sledeci_servis is not null and najnoviji.kilometraza is not null
      then poslednji_redovan.kilometraza_sledeci_servis - najnoviji.kilometraza
    else null
  end as preostalo_km
from vozila v
left join lateral (
  select kilometraza
  from odrzavanje
  where vozilo_id = v.id and kilometraza is not null
  order by datum_servisa desc, created_at desc
  limit 1
) najnoviji on true
left join lateral (
  select kilometraza_sledeci_servis
  from odrzavanje
  where vozilo_id = v.id and tip_servisa = 'redovan' and kilometraza_sledeci_servis is not null
  order by datum_servisa desc, created_at desc
  limit 1
) poslednji_redovan on true;

-- Dokumenta (vozila i vozača) sortirana po roku isteka, sa nazivom vlasnika već spojenim -
-- koristi se na Pregledu umesto povlačenja svih dokumenata i spajanja na klijentu.
create or replace view v_dokumenta_sa_vlasnikom as
select
  d.*,
  v.registracija as vozilo_registracija,
  v.marka_tip as vozilo_marka_tip,
  vc.ime_prezime as vozac_ime_prezime
from dokumenta d
left join vozila v on v.id = d.vozilo_id
left join vozaci vc on vc.id = d.vozac_id;

grant select on v_status_servisa to authenticated;
grant select on v_dokumenta_sa_vlasnikom to authenticated;
