import { nazivTipaDokumenta } from "@/lib/tipDokumenta";

export function grupisiDokumenta(dokumenta, kljucPolje, vlasnikPolje, q, poljaVlasnika) {
  const mapa = new Map();
  dokumenta
    .filter((d) => d[kljucPolje])
    .forEach((d) => {
      const kljuc = d[kljucPolje];
      if (!mapa.has(kljuc)) mapa.set(kljuc, { kljuc, vlasnik: d[vlasnikPolje], dokumenti: [] });
      mapa.get(kljuc).dokumenti.push(d);
    });

  let grupe = Array.from(mapa.values());

  if (!q) return grupe;

  return grupe
    .map((g) => {
      const vlasnikOdgovara = poljaVlasnika(g.vlasnik).filter(Boolean).some((v) => v.toLowerCase().includes(q));
      if (vlasnikOdgovara) return g;
      const dokFiltrirani = g.dokumenti.filter((d) =>
        [nazivTipaDokumenta(d.tip), d.broj, d.izdavalac].filter(Boolean).some((v) => v.toLowerCase().includes(q))
      );
      return dokFiltrirani.length ? { ...g, dokumenti: dokFiltrirani } : null;
    })
    .filter(Boolean);
}
