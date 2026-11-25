export const PODRAZUMEVANA_PODESAVANJA = {
  id: "default",
  naziv_firme: "Vozni park",
  akcenat_tamno: "#f0f941",
  akcenat_svetlo: "#0d9488",
  prag_servis_km: 2000,
  prag_rokovi_dana: 14,
  prikaz_vozila: {
    marka_tip: true,
    vrsta_vozila: false,
    broj_sedista: true,
    vozac: true,
    vlasnistvo: false,
    aktivno: true,
    u_voznom_parku: true,
    istek_registracije: true,
  },
  prikaz_vozaci: {
    telefon: true,
    email: true,
    broj_vozacke: true,
    kategorija: true,
    aktivan: true,
  },
  prikaz_pregled: {
    stat_vozila: true,
    stat_dokumenta: true,
    stat_servis: true,
    stat_sestomesecni: true,
    sekcija_dokumenta: true,
    sekcija_servis: true,
    sekcija_sastav: true,
    sekcija_sestomesecni: true,
  },
};

export async function ucitajPodesavanja(supabase) {
  try {
    const { data } = await supabase.from("podesavanja").select("*").eq("id", "default").maybeSingle();
    if (!data) return PODRAZUMEVANA_PODESAVANJA;
    return {
      ...PODRAZUMEVANA_PODESAVANJA,
      ...data,
      prikaz_vozila: { ...PODRAZUMEVANA_PODESAVANJA.prikaz_vozila, ...(data.prikaz_vozila || {}) },
      prikaz_vozaci: { ...PODRAZUMEVANA_PODESAVANJA.prikaz_vozaci, ...(data.prikaz_vozaci || {}) },
      prikaz_pregled: { ...PODRAZUMEVANA_PODESAVANJA.prikaz_pregled, ...(data.prikaz_pregled || {}) },
    };
  } catch {
    return PODRAZUMEVANA_PODESAVANJA;
  }
}
