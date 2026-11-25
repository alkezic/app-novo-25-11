export function formatIznos(iznos, valuta = "RSD") {
  const broj = Number(iznos || 0);
  return `${broj.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${valuta}`;
}

export const STATUS_RACUNA = {
  placeno: { label: "Plaćeno", tone: "ok" },
  delimicno: { label: "Delimično", tone: "warn" },
  neplaceno: { label: "Neplaćeno", tone: "danger" },
  storniran: { label: "Storniran", tone: "neutral" },
};

export function statusRacuna(status) {
  return STATUS_RACUNA[status] || { label: status || "—", tone: "neutral" };
}

// Prepoznaje brojeve računa pomenute u slobodnom tekstu napomene - poredi samo
// sa STVARNIM brojevima računa tog partnera, nikad generičkim regexom, da ne bi
// pogrešno pogodio broj koji slučajno liči na broj računa.
export function prepoznajRacuneIzNapomene(napomena, sviRacuniPartnera) {
  if (!napomena || !napomena.trim()) return [];
  const tekst = napomena.toLowerCase();
  return sviRacuniPartnera.filter((r) => r.broj_racuna && tekst.includes(r.broj_racuna.toLowerCase()));
}
