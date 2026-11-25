export const TIP_DOKUMENTA_LABELA = {
  registracija: "Saobraćajna dozvola",
  kasko: "Kasko",
  staklo: "Staklo",
  AO: "AO",
  tahograf: "Uverenje tahograf",
  ams: "Uverenje AMS",
  coc: "COC dokument",
  sestomesecni_pregled: "Šestomesečni pregled",
  "tehnički pregled": "Tehnički pregled",
  "servisna knjiga": "Servisna knjiga",
  vozacka_dozvola: "Vozačka dozvola",
  lekarsko_uverenje: "Lekarsko uverenje",
  tahograf_kartica: "Tahograf kartica",
  ostalo: "Ostalo",
};

// Tipovi dokumenata koji se vezuju za vozilo
export const TIPOVI_DOKUMENATA_VOZILO = [
  "registracija", "kasko", "staklo", "AO", "tahograf", "ams", "coc", "sestomesecni_pregled",
  "tehnički pregled", "servisna knjiga", "ostalo",
];

// Tipovi dokumenata koji se vezuju za vozača
export const TIPOVI_DOKUMENATA_VOZAC = [
  "vozacka_dozvola", "lekarsko_uverenje", "tahograf_kartica", "ostalo",
];

// Tipovi kod kojih je datum izdavanja obavezan (bitno za praćenje rokova)
export const TIPOVI_SA_OBAVEZNIM_DATUMOM = ["tahograf", "sestomesecni_pregled"];

export function nazivTipaDokumenta(tip) {
  return TIP_DOKUMENTA_LABELA[tip] || tip;
}
