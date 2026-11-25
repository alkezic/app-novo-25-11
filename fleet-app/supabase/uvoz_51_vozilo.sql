-- Automatski generisan uvoz iz: /mnt/user-data/uploads/sablon_vozila.csv
-- Nalepi ceo sadržaj u Supabase SQL Editor i pokreni.

begin;

-- Vozilo 1: BG1136-NU
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('bb356e6b-de82-4812-b0c7-7d525c22e188', 'BG1136-NU', 'DAF AXIAL 50 II', 2003, 'XMGDE40XS0H010808', 51, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('bb356e6b-de82-4812-b0c7-7d525c22e188', 'registracija', '2026-08-31');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('bb356e6b-de82-4812-b0c7-7d525c22e188', 'Srbija', '19441093598');

-- Vozilo 2: BG1307-FN
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('2d457395-38fb-414b-a0ea-bdbc7557f1c8', 'BG1307-FN', 'NEOPLAN SKYLINER', 2006, 'WAGPB2ZZX74001441', 83, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('2d457395-38fb-414b-a0ea-bdbc7557f1c8', 'registracija', '2027-05-31');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('2d457395-38fb-414b-a0ea-bdbc7557f1c8', 'Srbija', '19441093556');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('2d457395-38fb-414b-a0ea-bdbc7557f1c8', 'Mađarska', '907156395622');

-- Vozilo 3: BG1554-OJ
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('018cac82-8d3c-44f4-82fb-ab4ce88d00e6', 'BG1554-OJ', 'MERCEDES BENZ SPRINTER', 2018, 'WDB9066571P647753', 21, 'minibus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('018cac82-8d3c-44f4-82fb-ab4ce88d00e6', 'registracija', '2026-12-19');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('018cac82-8d3c-44f4-82fb-ab4ce88d00e6', 'Srbija', '19441093622');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('018cac82-8d3c-44f4-82fb-ab4ce88d00e6', 'Mađarska', '907139303511');

-- Vozilo 4: BG1700-ZB
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('12b29275-db43-4510-9808-0a4df87a39df', 'BG1700-ZB', 'MERCEDES BENZ SPRINTER 519 CDI', 2010, 'WDB9066571S492639', 21, 'minibus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('12b29275-db43-4510-9808-0a4df87a39df', 'registracija', '2026-12-20');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('12b29275-db43-4510-9808-0a4df87a39df', 'Srbija', '17430092381');

-- Vozilo 5: BG1843-HE
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('3bcfbbfc-13f1-4ff7-bfa5-fb6b52364ad1', 'BG1843-HE', 'VDL BUS – AXIAL', 2010, 'XMGDE40MS0H018928', 53, 'autobus', true, 'DA', 'sopstveno', NULL, 'KOVAČEVIĆ', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('3bcfbbfc-13f1-4ff7-bfa5-fb6b52364ad1', 'registracija', '2027-01-28');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('3bcfbbfc-13f1-4ff7-bfa5-fb6b52364ad1', 'Srbija', '20300768635');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('3bcfbbfc-13f1-4ff7-bfa5-fb6b52364ad1', 'Mađarska', '907179174855');

-- Vozilo 6: BG1843-JE
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('38cea476-87c5-4756-b359-50cb90e8e9a2', 'BG1843-JE', 'VDL – JONCKHEERE', 2007, 'XMGDE40PS0H014824', 51, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('38cea476-87c5-4756-b359-50cb90e8e9a2', 'registracija', '2027-02-21');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('38cea476-87c5-4756-b359-50cb90e8e9a2', 'Srbija', '22190828537');

-- Vozilo 7: BG1843-JF
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('ac9a92ff-596c-4dfc-97dd-040c1adc838d', 'BG1843-JF', 'VDL BERKHOF – AXIAL 70', 2008, 'XMGDE40MS0H016019', 57, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('ac9a92ff-596c-4dfc-97dd-040c1adc838d', 'registracija', '2027-02-02');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('ac9a92ff-596c-4dfc-97dd-040c1adc838d', 'Srbija', '17330597737');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('ac9a92ff-596c-4dfc-97dd-040c1adc838d', 'Mađarska', '907122041813');

-- Vozilo 8: BG1877-UH
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('c975ea3f-f216-47a2-a691-3d0d7043bb50', 'BG1877-UH', 'VDL BOVA – FUTURA CLASSIC FHD 104-365', 2006, 'XL9AA16R633003066', 47, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('c975ea3f-f216-47a2-a691-3d0d7043bb50', 'registracija', '2027-05-10');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('c975ea3f-f216-47a2-a691-3d0d7043bb50', 'Srbija', '16180084960');

-- Vozilo 9: BG1934-BX
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('a5c3c43e-2993-4401-8419-eac546d71616', 'BG1934-BX', 'MERCEDES BENZ – SPRINTER', 2020, 'W1V9076571P222496', 21, 'minibus', true, 'NE', 'sopstveno', NULL, NULL, '- ISTEKLO');
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('a5c3c43e-2993-4401-8419-eac546d71616', 'registracija', '2027-07-13');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('a5c3c43e-2993-4401-8419-eac546d71616', 'Srbija', '22410929347');

-- Vozilo 10: BG1959-EZ
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('c071e9b2-9cdf-402a-b3ab-f319d771aa95', 'BG1959-EZ', 'MERCEDES BENZ - SPRINTER', 2020, 'W1V9076571P219878', 21, 'minibus', true, 'NE', 'sopstveno', NULL, NULL, '- ISTEKLO');
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('c071e9b2-9cdf-402a-b3ab-f319d771aa95', 'registracija', '2026-08-23');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('c071e9b2-9cdf-402a-b3ab-f319d771aa95', 'Srbija', '22180405015');

-- Vozilo 11: BG2080-IN
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('8f8a2ace-0371-43e6-852e-b07b442c8aee', 'BG2080-IN', 'MERCEDES BENZ – ATEGO 1022 L', 2007, 'WDB9702451L289136', 35, 'minibus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('8f8a2ace-0371-43e6-852e-b07b442c8aee', 'registracija', '2027-03-25');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('8f8a2ace-0371-43e6-852e-b07b442c8aee', 'Srbija', '22180405510');

-- Vozilo 12: BG2247-FI
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('095a8c28-6f50-4a4e-acb6-345543ab8f43', 'BG2247-FI', 'VDL BERKHOF AXIAL', 2008, 'XMGDE40MS0H014879', 51, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('095a8c28-6f50-4a4e-acb6-345543ab8f43', 'registracija', '2027-04-01');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('095a8c28-6f50-4a4e-acb6-345543ab8f43', 'Srbija', '18380377319');

-- Vozilo 13: BG2446-LI
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('dae796ff-7d0a-466c-ba33-4dba6fd40048', 'BG2446-LI', 'BOVA FUTURA', 2007, 'XL9AA18R733003199', 51, 'autobus', true, 'DA', 'sopstveno', NULL, 'ĆIRA', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('dae796ff-7d0a-466c-ba33-4dba6fd40048', 'registracija', '2026-08-31');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('dae796ff-7d0a-466c-ba33-4dba6fd40048', 'Srbija', '23450853306');

-- Vozilo 14: BG2635-CH
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('d3656b2d-4057-4b83-b683-4c19a44b9b74', 'BG2635-CH', 'VAN HOOL TD 927 ACTROMEGA', NULL, NULL, NULL, 'autobus', true, 'DA', 'sopstveno', NULL, 'BANE GARDAŠEVIĆ', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('d3656b2d-4057-4b83-b683-4c19a44b9b74', 'registracija', '2027-06-07');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('d3656b2d-4057-4b83-b683-4c19a44b9b74', 'Srbija', '23450853421');

-- Vozilo 15: BG2723-HC
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('bacde44a-984b-46de-ae13-0325b5433140', 'BG2723-HC', 'MERCEDES BENZ SPRINTER', 2023, 'W1V5KDHZ3PP548529', 21, 'minibus', true, 'DA', 'lizing', 'INTESA LEASING 25988/23', NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('bacde44a-984b-46de-ae13-0325b5433140', 'registracija', '2026-10-25');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('bacde44a-984b-46de-ae13-0325b5433140', 'Srbija', '16450110685');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('bacde44a-984b-46de-ae13-0325b5433140', 'Mađarska', '907111542086');

-- Vozilo 16: BG2753-XR
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('49acd3f0-e641-48ce-bcfe-9a4e67a24dcf', 'BG2753-XR', 'MERCEDES BENZ SPRINTER', 2023, 'W1V5KDHZXPP567028', 21, 'minibus', true, 'DA', 'lizing', 'INTESA LEASING 25985/23', NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('49acd3f0-e641-48ce-bcfe-9a4e67a24dcf', 'registracija', '2026-12-11');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('49acd3f0-e641-48ce-bcfe-9a4e67a24dcf', 'Srbija', '23500941168');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('49acd3f0-e641-48ce-bcfe-9a4e67a24dcf', 'Mađarska', '907181995883');

-- Vozilo 17: BG2765-VC
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('871b9e72-3d02-46b7-8d79-bcef910d348f', 'BG2765-VC', 'VOLKSWAGEN,VW CRAFTER', 2023, 'WV1ZZZSY1P9061387', 21, 'minibus', true, 'DA', 'lizing', 'INTESA LEASING 26944/23', NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('871b9e72-3d02-46b7-8d79-bcef910d348f', 'registracija', '2027-01-08');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('871b9e72-3d02-46b7-8d79-bcef910d348f', 'Srbija', '23500941127');

-- Vozilo 18: BG2779-RV
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('1a2a7e52-a891-4947-9dd2-53496ece14b4', 'BG2779-RV', 'VW CRAFTER', 2023, 'WV1ZZZSY5P9059397', 21, 'minibus', true, 'DA', 'lizing', 'INTESA LEASING 26937/23', NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('1a2a7e52-a891-4947-9dd2-53496ece14b4', 'registracija', '2027-01-15');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('1a2a7e52-a891-4947-9dd2-53496ece14b4', 'Srbija', '24420352262');

-- Vozilo 19: BG2781-GE
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('eba7a6c7-cf1c-4fee-b86a-287831f50e8e', 'BG2781-GE', 'HIGER KLQ6920Q BASE', 2014, 'LKLA1L1P5EB657103', 51, 'autobus', true, 'DA', 'sopstveno', NULL, 'PERA IVANČA', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('eba7a6c7-cf1c-4fee-b86a-287831f50e8e', 'registracija', '2027-01-05');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('eba7a6c7-cf1c-4fee-b86a-287831f50e8e', 'Srbija', '17370486189');

-- Vozilo 20: BG2788-BF
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('c667f2ad-0377-4dff-b376-a312da18c631', 'BG2788-BF', 'NEOPLAN SKYLINER', 2008, 'WAGPB2ZZ785000372', 78, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('c667f2ad-0377-4dff-b376-a312da18c631', 'registracija', '2027-02-07');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('c667f2ad-0377-4dff-b376-a312da18c631', 'Srbija', '16370751477');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('c667f2ad-0377-4dff-b376-a312da18c631', 'Mađarska', '907144161862');

-- Vozilo 21: BG2800-MX
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('83c40585-3870-431f-ba9b-65a0ab2b7fe6', 'BG2800-MX', 'MERCEDES BENZ SPRINTER 517 CDI', 2023, 'W1V5KDHZ9RP653868', 21, 'minibus', true, 'DA', 'lizing', 'INTESA LEASING 27566/24', NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('83c40585-3870-431f-ba9b-65a0ab2b7fe6', 'registracija', '2027-02-26');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('83c40585-3870-431f-ba9b-65a0ab2b7fe6', 'Srbija', '17430092266');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('83c40585-3870-431f-ba9b-65a0ab2b7fe6', 'Mađarska', '907180846368');

-- Vozilo 22: BG2841-AM
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('5b497027-5147-47ef-b447-72fda077b7e4', 'BG2841-AM', 'VDL BOVA FUTURA', 2007, 'XL9AA18R733003439', 51, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('5b497027-5147-47ef-b447-72fda077b7e4', 'registracija', '2027-04-12');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('5b497027-5147-47ef-b447-72fda077b7e4', 'Srbija', '16370906410');

-- Vozilo 23: BG2858-JV
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('41154328-f410-4dd5-bf8b-f5e39adbc949', 'BG2858-JV', 'MERCEDES BENZ SPRINTER', 2024, 'W1V5KDHZ9RP675370', 21, 'minibus', true, 'DA', 'lizing', 'INTESA LEASING 28413/24', 'POP', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('41154328-f410-4dd5-bf8b-f5e39adbc949', 'registracija', '2027-05-10');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('41154328-f410-4dd5-bf8b-f5e39adbc949', 'Srbija', '16450262528');

-- Vozilo 24: BG2865-IC
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('5350c724-7fc2-4dd8-bfe1-c7b4401ebd8a', 'BG2865-IC', 'VDL BOVA SYNERGY DD', 2006, 'XMGDR40XS0H013925', 83, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('5350c724-7fc2-4dd8-bfe1-c7b4401ebd8a', 'registracija', '2027-05-08');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('5350c724-7fc2-4dd8-bfe1-c7b4401ebd8a', 'Srbija', '16450174087');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('5350c724-7fc2-4dd8-bfe1-c7b4401ebd8a', 'Mađarska', '907179718347');

-- Vozilo 25: BG2882-GJ
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('1b9e3f6f-ba27-4fa6-9ed4-bf8d141aa5ad', 'BG2882-GJ', 'MERCEDES TOURISMO RHD-M/2A', 2011, 'WEB63203613257256', 55, 'autobus', true, 'DA', 'sopstveno', NULL, 'GILE', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('1b9e3f6f-ba27-4fa6-9ed4-bf8d141aa5ad', 'registracija', '2026-12-23');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('1b9e3f6f-ba27-4fa6-9ed4-bf8d141aa5ad', 'Srbija', '24420352221');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('1b9e3f6f-ba27-4fa6-9ed4-bf8d141aa5ad', 'Mađarska', '907129885451');

-- Vozilo 26: BG2905-BZ
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('aae76f1d-4562-48f1-b4ab-d0ca451c1449', 'BG2905-BZ', 'VDL SDD-141/510', 2012, 'XMGDR40MS0H021184', 93, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('aae76f1d-4562-48f1-b4ab-d0ca451c1449', 'registracija', '2027-06-28');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('aae76f1d-4562-48f1-b4ab-d0ca451c1449', 'Srbija', '23450853413');

-- Vozilo 27: BG2909-UD
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('78bef44f-6920-4253-8b55-bda4671e1de1', 'BG2909-UD', 'MAN RHC 414', 2004, 'WMAR07ZZ74T005575', 51, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('78bef44f-6920-4253-8b55-bda4671e1de1', 'registracija', '2027-07-09');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('78bef44f-6920-4253-8b55-bda4671e1de1', 'Srbija', '24471736090');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('78bef44f-6920-4253-8b55-bda4671e1de1', 'Mađarska', '907185051337');

-- Vozilo 28: BG2918-DJ
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('0ef0e36b-4bf9-4d92-9bdb-9e848b1b6e4d', 'BG2918-DJ', 'VDL BOVA MAGIQ', 2009, 'XL9158EF511320414', 51, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('0ef0e36b-4bf9-4d92-9bdb-9e848b1b6e4d', 'registracija', '2026-07-12');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('0ef0e36b-4bf9-4d92-9bdb-9e848b1b6e4d', 'Srbija', '24471732420');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('0ef0e36b-4bf9-4d92-9bdb-9e848b1b6e4d', 'Mađarska', '907171343938');

-- Vozilo 29: BG2976-ED
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('244129fe-a0af-4207-8add-db5614321388', 'BG2976-ED', 'SETRA S 415 GT-HD', 2007, 'WKK63213113104390', 51, 'autobus', true, 'DA', 'sopstveno', NULL, 'Milan', 'PLAVA');
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('244129fe-a0af-4207-8add-db5614321388', 'registracija', '2026-10-27');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('244129fe-a0af-4207-8add-db5614321388', 'Srbija', '22180405015');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('244129fe-a0af-4207-8add-db5614321388', 'Mađarska', '907154294959');

-- Vozilo 30: BG2977-NZ
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('dc78a202-f536-4617-a86d-23e155846d63', 'BG2977-NZ', 'SETRA S 415 GT-HD', 2009, 'WKK63213113108947', 46, 'autobus', true, 'DA', 'sopstveno', NULL, 'Galac', 'SIVA');
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('dc78a202-f536-4617-a86d-23e155846d63', 'registracija', '2026-10-11');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('dc78a202-f536-4617-a86d-23e155846d63', 'Srbija', '24471744904');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('dc78a202-f536-4617-a86d-23e155846d63', 'Mađarska', '907151267560');

-- Vozilo 31: BG2977-RL
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('87a09bf9-3060-4048-8995-a6109375dcd5', 'BG2977-RL', 'VOLKSWAGEN,VW CRAFTER', 2024, 'WV1ZZZSY7R9056777', 21, 'minibus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('87a09bf9-3060-4048-8995-a6109375dcd5', 'registracija', '2026-10-14');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('87a09bf9-3060-4048-8995-a6109375dcd5', 'Srbija', '24471732461');

-- Vozilo 32: BG3018-LK
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('38038e7f-4249-4427-99eb-6655670a59e4', 'BG3018-LK', 'FENIKSBUS FBI 86T', 2024, 'ZCFC872F605616815', 31, 'autobus', true, 'DA', 'lizing', 'INTESA LEASING 30857/24', NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('38038e7f-4249-4427-99eb-6655670a59e4', 'registracija', '2027-01-11');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('38038e7f-4249-4427-99eb-6655670a59e4', 'Srbija', '16320150317');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('38038e7f-4249-4427-99eb-6655670a59e4', 'Mađarska', '907157175593');

-- Vozilo 33: BG3041-FM
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('44e77bda-555d-4745-99a7-729dbea0adcc', 'BG3041-FM', 'FENIKSBUS FBI 86T', 2024, 'ZCFC872F905616467', 31, 'autobus', true, 'DA', 'lizing', 'INTESA LEASING 31578/25', NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('44e77bda-555d-4745-99a7-729dbea0adcc', 'registracija', '2027-02-04');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('44e77bda-555d-4745-99a7-729dbea0adcc', 'Srbija', '25211752156');

-- Vozilo 34: BG3055-EB
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('3355d05f-1914-4754-aa7d-d80da591b30b', 'BG3055-EB', 'FENIKSBUS FBI 86T', 2024, 'ZCFC872F205619520', 31, 'autobus', true, 'DA', 'lizing', 'INTESA LEASING 31878/25', 'KRNJAJIĆ', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('3355d05f-1914-4754-aa7d-d80da591b30b', 'registracija', '2027-03-05');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('3355d05f-1914-4754-aa7d-d80da591b30b', 'Srbija', '25350151863');

-- Vozilo 35: BG3070-CD
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('cd06885f-b231-4c9a-9fb0-dca8f04952da', 'BG3070-CD', 'MERCEDES TOURINO', 2013, 'WEB44430313000778', 32, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('cd06885f-b231-4c9a-9fb0-dca8f04952da', 'registracija', '2027-03-17');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('cd06885f-b231-4c9a-9fb0-dca8f04952da', 'Srbija', '25350151871');

-- Vozilo 36: BG3076-UK
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('a8a87100-1db2-4e1e-a09c-ecf0d2ef941b', 'BG3076-UK', 'VOLKSWAGEN CRAFTER', 2023, 'WV1ZZZSY6P9061689', 21, 'minibus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('a8a87100-1db2-4e1e-a09c-ecf0d2ef941b', 'registracija', '2026-08-11');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('a8a87100-1db2-4e1e-a09c-ecf0d2ef941b', 'Srbija', '25350151889');

-- Vozilo 37: BG3084-ZN
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('74d31765-fb67-4f1c-8f68-86a2cb4888cb', 'BG3084-ZN', 'MAN 18400 HOCL/R EEV', 2009, 'WMAR33ZZ8AC014538', 51, 'autobus', true, 'DA', 'sopstveno', NULL, 'GARDAŠEVIĆ', 'CRVENI');
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('74d31765-fb67-4f1c-8f68-86a2cb4888cb', 'registracija', '2027-04-25');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('74d31765-fb67-4f1c-8f68-86a2cb4888cb', 'Srbija', '16180084952');

-- Vozilo 38: BG3166-FO
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('6005e99e-63f7-4dd3-9934-8b959e577db2', 'BG3166-FO', 'VAN HOOL T 911', 2011, 'YE2911SH249D54285', 38, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('6005e99e-63f7-4dd3-9934-8b959e577db2', 'registracija', '2026-07-31');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('6005e99e-63f7-4dd3-9934-8b959e577db2', 'Srbija', '16180084937');

-- Vozilo 39: BG3183-ED
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('1edbb000-5370-4f77-b171-abe6037d21a6', 'BG3183-ED', 'SETRA S 417 GT HD', 2010, 'WKK63213313109343', 59, 'autobus', true, 'DA', 'sopstveno', NULL, 'MARKO MARINKOVIĆ', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('1edbb000-5370-4f77-b171-abe6037d21a6', 'registracija', '2026-09-11');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('1edbb000-5370-4f77-b171-abe6037d21a6', 'Srbija', '25350151897');

-- Vozilo 40: BG3195-VG
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('0f6cd62a-94b7-4438-886b-be024587df8a', 'BG3195-VG', 'SETRA S 415 GT-HD', 2011, 'WKK63213113111627', 54, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('0f6cd62a-94b7-4438-886b-be024587df8a', 'registracija', '2026-09-19');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('0f6cd62a-94b7-4438-886b-be024587df8a', 'Srbija', '25211752198');

-- Vozilo 41: BG3196-EU
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('fbffbf21-1d09-43b4-bf2c-8a1927ad3908', 'BG3196-EU', 'VDL FUTURA FHD2 129.365', 2011, 'XNL501E100D000811', 59, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('fbffbf21-1d09-43b4-bf2c-8a1927ad3908', 'registracija', '2026-11-21');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('fbffbf21-1d09-43b4-bf2c-8a1927ad3908', 'Srbija', '25380807625');

-- Vozilo 42: BG3196-EV
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('0521cbf0-0842-47ae-8c4f-41686a6cdc04', 'BG3196-EV', 'SETRA S 415 GT-HD', 2009, 'WKK63213113108025', 54, 'autobus', true, 'DA', 'sopstveno', NULL, 'ANTONIJEVIĆ', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('0521cbf0-0842-47ae-8c4f-41686a6cdc04', 'registracija', '2026-11-21');

-- Vozilo 43: BG3215-EF
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('3e0042fd-9a62-4f3f-87ae-e3a40fe01a90', 'BG3215-EF', 'SETRA S 417 GT-HD', 2007, 'WKK63213313103924', 66, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('3e0042fd-9a62-4f3f-87ae-e3a40fe01a90', 'registracija', '2026-10-23');
insert into putarine (vozilo_id, zemlja, broj_taga) values ('3e0042fd-9a62-4f3f-87ae-e3a40fe01a90', 'Srbija', '23500931128');

-- Vozilo 44: BG3225-FC
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('a6d94e3d-0ff2-4215-ad33-a9159744f6e7', 'BG3225-FC', 'VDL BOVASYNERGY DD', 2007, 'XMGDR40MS0H014852', 86, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('a6d94e3d-0ff2-4215-ad33-a9159744f6e7', 'registracija', '2026-10-15');

-- Vozilo 45: BG3229-RT
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('88905fe8-35a0-4eb3-b304-4e879cb6ee2e', 'BG3229-RT', 'VDL BOVA MAGIQ', 2006, 'XL9260AM310320793', 65, 'autobus', true, 'DA', 'sopstveno', NULL, 'JOVAN RELIĆ', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('88905fe8-35a0-4eb3-b304-4e879cb6ee2e', 'registracija', '2026-11-29');

-- Vozilo 46: BG3286-HV
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('183c2839-6498-4cbb-9e90-0396d7aebbe9', 'BG3286-HV', 'MAN LIONS COACH C', 2011, 'WMAR09ZZ3CT018236', 57, 'autobus', true, 'DA', 'sopstveno', NULL, 'MOMČILOVIĆ', NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('183c2839-6498-4cbb-9e90-0396d7aebbe9', 'registracija', '2027-02-11');

-- Vozilo 47: BG3286-HZ
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('1f4862c3-3ef7-481c-8f80-95645eb13029', 'BG3286-HZ', 'NEOPLAN N1216 HD', 2011, 'WAGP14ZZ0B5001613', 50, 'autobus', true, 'DA', 'sopstveno', NULL, NULL, 'promena saobraćajne - BG3179-CR');
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('1f4862c3-3ef7-481c-8f80-95645eb13029', 'registracija', '2026-09-02');

-- Vozilo 48: BG3317-UT
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('37bc6f53-bb29-410f-aa93-89b6385c03e8', 'BG3317-UT', 'MERCEDES BENZ SPRINTER', 2025, 'W1V5KDHZ3TP857895', 21, 'minibus', true, 'DA', 'lizing', 'INTESA LEASING 35798/26', NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('37bc6f53-bb29-410f-aa93-89b6385c03e8', 'registracija', '2027-03-13');

-- Vozilo 49: BG3325-EN
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('03638628-edc5-42ce-bcf8-992a47bf4c15', 'BG3325-EN', 'MERCEDES BENZ SPRINTER', 2025, 'W1V5MDHZ4TP871184', 21, 'minibus', true, 'DA', 'lizing', 'INTESA LEASING 36511/26', NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('03638628-edc5-42ce-bcf8-992a47bf4c15', 'registracija', '2027-04-29');

-- Vozilo 50: BG770-BS
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('365e7219-5a10-4f0e-9f5f-1d3d1e037fe7', 'BG770-BS', 'VOLKSWAGEN CRAFTER 35MR 2,5 TDI', 2007, 'WV1ZZZ2EZ86023922', 12, 'minibus', true, 'DA', 'sopstveno', NULL, NULL, NULL);
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('365e7219-5a10-4f0e-9f5f-1d3d1e037fe7', 'registracija', '2027-03-28');

-- Vozilo 51: GM038-UB
insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ('ea3f16cb-b7c3-4065-94fe-4dceef488498', 'GM038-UB', 'MERCEDES BENZ SPRINTER 516 CDI', 2019, 'WDB9076571P147232', 21, 'minibus', true, 'NE', 'sopstveno', NULL, NULL, 'ZAKUP');
insert into dokumenta (vozilo_id, tip, datum_isteka) values ('ea3f16cb-b7c3-4065-94fe-4dceef488498', 'registracija', '2026-11-01');

commit;

-- Ukupno uvezeno vozila: 51
