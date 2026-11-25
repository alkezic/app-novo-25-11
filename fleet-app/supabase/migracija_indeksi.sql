-- ============================================================
-- MIGRACIJA: indeksi za brzinu
-- Bezbedno za pokretanje na POSTOJEĆOJ bazi - ništa ne briše,
-- samo ubrzava upite koji filtriraju/spajaju po ovim kolonama.
-- ============================================================

create index if not exists idx_dokumenta_vozilo_id on dokumenta(vozilo_id);
create index if not exists idx_dokumenta_vozac_id on dokumenta(vozac_id);
create index if not exists idx_dokumenta_tip on dokumenta(tip);
create index if not exists idx_dokumenta_datum_isteka on dokumenta(datum_isteka);

create index if not exists idx_putarine_vozilo_id on putarine(vozilo_id);

create index if not exists idx_odrzavanje_vozilo_id on odrzavanje(vozilo_id);
create index if not exists idx_odrzavanje_datum_servisa on odrzavanje(datum_servisa desc);

create index if not exists idx_vozilo_fotografije_vozilo_id on vozilo_fotografije(vozilo_id);

create index if not exists idx_vozila_vozac_id on vozila(vozac_id);

create index if not exists idx_racuni_vozilo_id on racuni(vozilo_id);
create index if not exists idx_racuni_partner_id on racuni(partner_id);
create index if not exists idx_racuni_rok_placanja on racuni(rok_placanja);

create index if not exists idx_placanja_racun_id on placanja(racun_id);

create index if not exists idx_log_izmena_created_at on log_izmena(created_at desc);
