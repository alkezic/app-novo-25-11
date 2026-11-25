-- ============================================================
-- MIGRACIJA: tip servisa (redovan / vanredni)
-- Bezbedno za pokretanje na POSTOJEĆOJ bazi - ništa ne briše.
-- ============================================================

alter table odrzavanje add column if not exists tip_servisa text not null default 'redovan';

-- opciono ograničenje na dozvoljene vrednosti (ne ruši postojeće redove)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'odrzavanje_tip_servisa_check'
  ) then
    alter table odrzavanje add constraint odrzavanje_tip_servisa_check
      check (tip_servisa in ('redovan', 'vanredni'));
  end if;
end $$;
