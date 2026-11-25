-- Automatski generisan uvoz iz: /mnt/user-data/uploads/ta_supabase.csv
-- Nalepi ceo sadržaj u Supabase SQL Editor i pokreni.

begin;

-- Vozilo 1: BG1136-NU
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('5ee41e62-33ef-437c-9f92-25c945482326', 'BG1136-NU', 'DAF AXIAL 50 II', 2003, 'XMGDE40XS0H010808', 51, 'autobus', true, true, 'lizing', '31856/26', 'Ime Prezime', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('5ee41e62-33ef-437c-9f92-25c945482326', 'registracija', '2026-08-31');
insert into dokumenta (vozilo_id, tip, broj, izdavalac) values ('5ee41e62-33ef-437c-9f92-25c945482326', 'kasko', 'text', 'Dunav osiguranje');
insert into dokumenta (vozilo_id, tip, broj, izdavalac) values ('5ee41e62-33ef-437c-9f92-25c945482326', 'staklo', 'text', 'Triglav osiguranje');
insert into dokumenta (vozilo_id, tip, broj, izdavalac) values ('5ee41e62-33ef-437c-9f92-25c945482326', 'AO', 'text', 'Dunav osiguranje');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('5ee41e62-33ef-437c-9f92-25c945482326', 'Srbija', '17330601794');

-- Vozilo 2: BG1307-FN
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('2ed9a092-b08f-4371-b786-96d65b12314a', 'BG1307-FN', 'NEOPLAN SKYLINER', 2006, 'WAGPB2ZZX74001441', 21, 'minibus', false, false, 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('2ed9a092-b08f-4371-b786-96d65b12314a', 'registracija', '2026-05-31');
insert into dokumenta (vozilo_id, tip, broj, izdavalac) values ('2ed9a092-b08f-4371-b786-96d65b12314a', 'kasko', 'text', 'DDOR Osiguranje');
insert into dokumenta (vozilo_id, tip, broj, izdavalac) values ('2ed9a092-b08f-4371-b786-96d65b12314a', 'staklo', 'text', 'Dunav osiguranje');
insert into dokumenta (vozilo_id, tip, broj, izdavalac) values ('2ed9a092-b08f-4371-b786-96d65b12314a', 'AO', 'text', 'DDOR Osiguranje');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('2ed9a092-b08f-4371-b786-96d65b12314a', 'Srbija', '22180406005');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('2ed9a092-b08f-4371-b786-96d65b12314a', 'Mađarska', '907156395622');

commit;

-- Ukupno uvezeno vozila: 2
