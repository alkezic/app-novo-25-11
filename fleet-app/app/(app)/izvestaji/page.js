"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, Save, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { nazivTipaDokumenta } from "@/lib/tipDokumenta";
import { ucitajPodesavanja } from "@/lib/podesavanja";
import { zabeleziIzmenu } from "@/lib/log";
import { rokStatus } from "@/components/StatusPill";
import { formatDatum } from "@/lib/datum";
import Skeleton from "@/components/Skeleton";

const TIPOVI_VOZILO = [
  { tip: "registracija", label: "Saobraćajna" },
  { tip: "kasko", label: "Kasko" },
  { tip: "staklo", label: "Staklo" },
  { tip: "AO", label: "AO" },
  { tip: "tahograf", label: "Tahograf" },
  { tip: "ams", label: "AMS" },
  { tip: "coc", label: "COC" },
];

// Obavezni dokumenti za svako vozilo
const TIPOVI_OBAVEZNI = [
  { tip: "registracija", label: "Saobraćajna" },
  { tip: "AO", label: "AO" },
  { tip: "tahograf", label: "Tahograf" },
  { tip: "sestomesecni_pregled", label: "6-MES. PREGLED" },
];

const TIPOVI_VOZAC = [
  { tip: "vozacka_dozvola", label: "Vozačka" },
  { tip: "lekarsko_uverenje", label: "Lekarsko" },
  { tip: "tahograf_kartica", label: "Tahograf kartica" },
];

const KATEGORIJE = [
  { key: "minibus", label: "Minibus (do 22)", test: (n) => n != null && n <= 22 },
  { key: "midibus", label: "Midibus (23–40)", test: (n) => n != null && n >= 23 && n <= 40 },
  { key: "autobus", label: "Autobus (41–70)", test: (n) => n != null && n >= 41 && n <= 70 },
  { key: "deker", label: "Deker (71+)", test: (n) => n != null && n >= 71 },
  { key: "nepoznato", label: "Bez unetog broja sedišta", test: (n) => n == null },
];

const CUSTOM_POLJA = [
  { key: "marka_tip", label: "Marka i tip", get: (v) => v.marka_tip || "—" },
  { key: "godina", label: "Godina", get: (v) => v.godina ?? "—" },
  { key: "vin", label: "VIN", get: (v) => v.vin || "—" },
  { key: "broj_sedista", label: "Broj sedišta", get: (v) => v.broj_sedista ?? "—" },
  { key: "vrsta_vozila", label: "Vrsta vozila", get: (v) => v.vrsta_vozila || "—" },
  { key: "vozac", label: "Vozač", get: (v) => v.vozaci?.ime_prezime || v.vozac || "—" },
  { key: "vlasnistvo", label: "Vlasništvo", get: (v) => v.vlasnistvo || "—" },
  { key: "aktivno", label: "Aktivno", get: (v) => (v.aktivno ? "Da" : "Ne") },
  { key: "u_voznom_parku", label: "U voznom parku", get: (v) => v.u_voznom_parku || "—" },
  {
    key: "istek_registracije",
    label: "Istek registracije",
    get: (v) => (v.istek_registracije ? formatDatum(v.istek_registracije) : "—"),
  },
];

const PREDEFINISANI = [
  { key: "vozila-dokumenta", label: "Vozila i dokumenta" },
  { key: "obavezni-dokumenti", label: "Obavezni dokumenti" },
  { key: "rokovi", label: "Rokovi koji ističu" },
  { key: "servisna-istorija", label: "Servisna istorija" },
  { key: "kategorije", label: "Vozila po kategoriji" },
  { key: "vozaci-dokumenta", label: "Vozači i dokumenta" },
  { key: "prilagodjeni", label: "Prilagođeni izveštaj" },
];

// Status dokumenta kao StatusPill umesto simbola
function statusDokumentaMeta(dokList, vlasnikId, tip, kljucVlasnika) {
  const nadjen = dokList.find((d) => d[kljucVlasnika] === vlasnikId && d.tip === tip);

  if (!nadjen) {
    return { label: "✗ Nema", tone: "danger" };
  }
  if (!nadjen.fajl_url) {
    return { label: "⚠ Bez fajla", tone: "warn" };
  }
  if (nadjen.datum_isteka) {
    const s = rokStatus(nadjen.datum_isteka);
    return { label: "✓ " + formatDatum(nadjen.datum_isteka), tone: s.tone };
  }
  return { label: "✓ Ima", tone: "ok" };
}

// Vraća true ako je 6-MES pregled obavezan za vozilo.
//
// Pravilo:
// 1. Vozilo mora biti starije od 2 godine (po godini proizvodnje)
// 2. Vozilo mora biti u drugom delu registracionog ciklusa (6-12 meseci pre isteka)
function jeSestomesecniObavezan(vozilo) {
  if (!vozilo?.istek_registracije) return false;

  // Uslov 1: vozilo mora biti starije od 2 godine
  if (vozilo.godina) {
    const trenutnaGodina = new Date().getFullYear();
    const starost = trenutnaGodina - Number(vozilo.godina);
    if (starost < 2) return false;
  }
  // Ako nema godinu → pretpostavljamo da je staro (ne blokiramo)

  // Uslov 2: u drugom delu ciklusa (6-12 meseci pre isteka)
  const istek = new Date(vozilo.istek_registracije);
  const sredinaCiklusa = new Date(istek);
  sredinaCiklusa.setMonth(sredinaCiklusa.getMonth() - 6);

  const danas = new Date();
  danas.setHours(0, 0, 0, 0);

  return danas >= sredinaCiklusa;
}

// Status za 6-MES koji poštuje pravilo obaveznosti
function statusSestomesecni(vozilo, dokumenta) {
  if (!jeSestomesecniObavezan(vozilo)) {
    return { label: "— nije obavezan", tone: "neutral" };
  }
  return statusDokumentaMeta(dokumenta, vozilo.id, "sestomesecni_pregled", "vozilo_id");
}

export default function IzvestajiPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [vozila, setVozila] = useState([]);
  const [vozaci, setVozaci] = useState([]);
  const [dokumenta, setDokumenta] = useState([]);
  const [odrzavanje, setOdrzavanje] = useState([]);
  const [sacuvani, setSacuvani] = useState([]);

  const [aktivni, setAktivni] = useState("vozila-dokumenta");
  const [danaUnapred, setDanaUnapred] = useState(14);
  const [voziloFilterServis, setVoziloFilterServis] = useState("sve");
  const [odabranaVozila, setOdabranaVozila] = useState(new Set());
  const [odabraneKategorije, setOdabraneKategorije] = useState(new Set());
  const [odabranaPolja, setOdabranaPolja] = useState({});
  const [nazivZaCuvanje, setNazivZaCuvanje] = useState("");
  const [cuvanje, setCuvanje] = useState(false);
  const [greska, setGreska] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortSmer, setSortSmer] = useState("asc");

  // Novi tab: Obavezni dokumenti
  const [obavPretraga, setObavPretraga] = useState("");
  const [obavFilterStatus, setObavFilterStatus] = useState("sve"); // "sve" | "problem" | "kompletno"
  const [obavSelektovana, setObavSelektovana] = useState(new Set());

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: v }, { data: vc }, { data: d }, { data: o }, podesavanja, { data: iz }] = await Promise.all([
      supabase.from("vozila").select("*, vozaci(ime_prezime)").order("registracija", { ascending: true }),
      supabase.from("vozaci").select("*").order("ime_prezime", { ascending: true }),
      supabase.from("dokumenta").select("*, vozila(marka_tip, registracija), vozaci(ime_prezime)").order("datum_isteka", { ascending: true }),
      supabase.from("odrzavanje").select("*, vozila(marka_tip, registracija)").order("datum_servisa", { ascending: false }),
      ucitajPodesavanja(supabase),
      supabase.from("izvestaji").select("*").order("created_at", { ascending: false }),
    ]);

    setVozila(v || []);
    setVozaci(vc || []);
    setDokumenta(d || []);
    setOdrzavanje(o || []);
    setSacuvani(iz || []);
    setDanaUnapred(podesavanja.prag_rokovi_dana);
    setOdabranaVozila(new Set((v || []).map((x) => x.id)));

    const poljaDef = {};
    CUSTOM_POLJA.forEach((p) => (poljaDef[p.key] = true));
    setOdabranaPolja(poljaDef);

    setLoading(false);
  }

  const izvestaj = useMemo(() => {
    if (loading) return { naslov: "", kolone: [], redovi: [] };

    function izvuciDatum(str) {
      const m = /\b(\d{2})\.(\d{2})\.(\d{4})\b/.exec(str);
      if (!m) return null;
      const t = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
      return Number.isNaN(t) ? null : t;
    }

    function sortiraj(niz) {
      if (!sortKey) return niz;
      const kopija = [...niz];
      kopija.sort((a, b) => {
        let av = a[sortKey];
        let bv = b[sortKey];

        // Ako je vrednost StatusPill objekat ({ label, tone }), koristi label za sortiranje
        if (av && typeof av === "object" && "label" in av) av = av.label;
        if (bv && typeof bv === "object" && "label" in bv) bv = bv.label;

        if (av == null) av = "";
        if (bv == null) bv = "";

        if (typeof av === "number" && typeof bv === "number") {
          return sortSmer === "asc" ? av - bv : bv - av;
        }

        const da = izvuciDatum(String(av));
        const db = izvuciDatum(String(bv));
        if (da != null && db != null) {
          return sortSmer === "asc" ? da - db : db - da;
        }

        const cmp = String(av).localeCompare(String(bv), "sr", { numeric: true });
        return sortSmer === "asc" ? cmp : -cmp;
      });
      return kopija;
    }

    if (aktivni === "vozila-dokumenta") {
      const kolone = [
        { key: "reg", label: "Registracija" },
        { key: "marka_tip_vozila", label: "Marka i tip" },
        { key: "istek_registracije", label: "Istek registracije" },
        ...TIPOVI_VOZILO.map((t) => ({ key: t.tip, label: t.label, pill: true })),
      ];
      const redovi = vozila.map((v) => {
        const red = {
          reg: v.registracija,
          marka_tip_vozila: v.marka_tip,
          istek_registracije: v.istek_registracije ? formatDatum(v.istek_registracije) : "—",
        };
        TIPOVI_VOZILO.forEach((t) => {
          red[t.tip] = statusDokumentaMeta(dokumenta, v.id, t.tip, "vozilo_id");
        });
        return red;
      });
      return { naslov: "Vozila i dokumenta", kolone, redovi: sortiraj(redovi) };
    }

    if (aktivni === "obavezni-dokumenti") {
      const kolone = [
        { key: "_check", label: "", checkbox: true },
        { key: "reg", label: "Registracija" },
        { key: "marka_tip_vozila", label: "Marka i tip" },
        { key: "vozac", label: "Vozač" },
        { key: "istek_registracije", label: "Istek registracije" },
        ...TIPOVI_OBAVEZNI.map((t) => ({ key: t.tip, label: t.label, pill: true })),
        { key: "_status", label: "Status", pill: true },
      ];

      let redovi = vozila.map((v) => {
        const red = {
          _id: v.id,
          reg: v.registracija,
          marka_tip_vozila: v.marka_tip,
          vozac: v.vozaci?.ime_prezime || v.vozac || "—",
          istek_registracije: v.istek_registracije ? formatDatum(v.istek_registracije) : "—",
        };

        let nedostaje = 0;
        TIPOVI_OBAVEZNI.forEach((t) => {
          const status = t.tip === "sestomesecni_pregled"
            ? statusSestomesecni(v, dokumenta)
            : statusDokumentaMeta(dokumenta, v.id, t.tip, "vozilo_id");

          red[t.tip] = status;

          if (status.tone === "danger" || status.tone === "warn") {
            nedostaje++;
          }
        });

        red._nedostaje = nedostaje;
        red._status =
          nedostaje === 0
            ? { label: "✓ Kompletno", tone: "ok" }
            : nedostaje === 1
            ? { label: "⚠ Nedostaje 1", tone: "warn" }
            : { label: "✗ Nedostaje " + nedostaje, tone: "danger" };

        return red;
      });

      if (obavPretraga.trim()) {
        const q = obavPretraga.toLowerCase();
        redovi = redovi.filter((r) =>
          [r.reg, r.marka_tip_vozila, r.vozac]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(q))
        );
      }

      if (obavFilterStatus === "problem") {
        redovi = redovi.filter((r) => r._nedostaje > 0);
      } else if (obavFilterStatus === "kompletno") {
        redovi = redovi.filter((r) => r._nedostaje === 0);
      }

      return { naslov: "Obavezni dokumenti", kolone, redovi: sortiraj(redovi) };
    }

    if (aktivni === "vozaci-dokumenta") {
      const kolone = [
        { key: "vozac", label: "Vozač" },
        ...TIPOVI_VOZAC.map((t) => ({ key: t.tip, label: t.label, pill: true })),
      ];
      const redovi = vozaci.map((v) => {
        const red = { vozac: v.ime_prezime };
        TIPOVI_VOZAC.forEach((t) => {
          red[t.tip] = statusDokumentaMeta(dokumenta, v.id, t.tip, "vozac_id");
        });
        return red;
      });
      return { naslov: "Vozači i dokumenta", kolone, redovi: sortiraj(redovi) };
    }

    if (aktivni === "rokovi") {
      const danas = new Date();
      danas.setHours(0, 0, 0, 0);
      const granica = new Date(danas);
      granica.setDate(granica.getDate() + Number(danaUnapred || 0));

      const filtriranaDokumenta = dokumenta.filter((d) => d.datum_isteka && new Date(d.datum_isteka) <= granica);
      const filtriranaRegistracija = vozila.filter((v) => v.istek_registracije && new Date(v.istek_registracije) <= granica);

      const kolone = [
        { key: "odnosi_se_na", label: "Odnosi se na" },
        { key: "tip", label: "Tip dokumenta" },
        { key: "istice", label: "Ističe" },
        { key: "status", label: "Status", pill: true },
      ];
      const redovi = [
        ...filtriranaDokumenta.map((d) => ({
          odnosi_se_na: d.vozila ? `${d.vozila.marka_tip} · ${d.vozila.registracija}` : d.vozaci ? `${d.vozaci.ime_prezime} (vozač)` : "—",
          tip: nazivTipaDokumenta(d.tip),
          istice: formatDatum(d.datum_isteka),
          status: rokStatus(d.datum_isteka),
        })),
        ...filtriranaRegistracija.map((v) => ({
          odnosi_se_na: `${v.marka_tip} · ${v.registracija}`,
          tip: "Istek registracije",
          istice: formatDatum(v.istek_registracije),
          status: rokStatus(v.istek_registracije),
        })),
      ];
      return { naslov: `Rokovi koji ističu u narednih ${danaUnapred} dana`, kolone, redovi: sortiraj(redovi) };
    }

    if (aktivni === "servisna-istorija") {
      const filtrirano = voziloFilterServis === "sve" ? odrzavanje : odrzavanje.filter((o) => o.vozilo_id === voziloFilterServis);
      const kolone = [
        { key: "vozilo", label: "Vozilo" },
        { key: "datum", label: "Datum" },
        { key: "vrsta", label: "Vrsta" },
        { key: "km", label: "Kilometraža" },
        { key: "kmSledeci", label: "Sledeći servis (km)" },
        { key: "majstor", label: "Majstor/servis" },
        { key: "opis", label: "Opis" },
        { key: "kvarovi", label: "Zapaženi kvarovi" },
      ];
      const redovi = filtrirano.map((o) => ({
        vozilo: o.vozila ? `${o.vozila.marka_tip} · ${o.vozila.registracija}` : "—",
        datum: formatDatum(o.datum_servisa),
        vrsta: o.tip_servisa === "vanredni" ? "Vanredni" : "Redovan",
        km: o.kilometraza ?? "—",
        kmSledeci: o.kilometraza_sledeci_servis ?? "—",
        majstor: o.majstor_servis || "—",
        opis: o.opis || "—",
        kvarovi: o.zapazeni_kvarovi || "—",
      }));
      return { naslov: "Servisna istorija", kolone, redovi: sortiraj(redovi) };
    }

    if (aktivni === "kategorije") {
      const kolone = [
        { key: "kategorija", label: "Kategorija" },
        { key: "broj", label: "Broj vozila" },
        { key: "registracije", label: "Registracije" },
      ];
      const redovi = KATEGORIJE.map((k) => {
        const uKategoriji = vozila.filter((v) => k.test(v.broj_sedista));
        return {
          kategorija: k.label,
          broj: uKategoriji.length,
          registracije: uKategoriji.map((v) => v.registracija).join(", ") || "—",
        };
      });
      return { naslov: "Vozila po kategoriji", kolone, redovi: sortiraj(redovi) };
    }

    if (aktivni === "prilagodjeni") {
      const aktivnaPolja = CUSTOM_POLJA.filter((p) => odabranaPolja[p.key]);
      const kolone = [{ key: "registracija", label: "Registracija" }, ...aktivnaPolja.map((p) => ({ key: p.key, label: p.label }))];
      const redovi = vozila
        .filter((v) => odabranaVozila.has(v.id))
        .map((v) => {
          const red = { registracija: v.registracija };
          aktivnaPolja.forEach((p) => (red[p.key] = p.get(v, dokumenta)));
          return red;
        });
      return { naslov: "Prilagođeni izveštaj", kolone, redovi: sortiraj(redovi) };
    }

    return { naslov: "", kolone: [], redovi: [] };
  }, [aktivni, vozila, vozaci, dokumenta, odrzavanje, danaUnapred, voziloFilterServis, odabranaVozila, odabranaPolja, loading, sortKey, sortSmer, obavPretraga, obavFilterStatus]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortSmer((s) => (s === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortSmer("asc");
    }
  }

  function handlePrint() {
    window.print();
  }

  function toggleVozilo(id) {
    setOdabranaVozila((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function svaVozila(izaberi) {
    setOdabranaVozila(izaberi ? new Set(vozila.map((v) => v.id)) : new Set());
  }

  function toggleKategorija(key) {
    setOdabraneKategorije((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function primeniKategorije() {
    const testovi = KATEGORIJE.filter((k) => odabraneKategorije.has(k.key));
    if (testovi.length === 0) return;
    const odgovarajuca = vozila.filter((v) => testovi.some((k) => k.test(v.broj_sedista))).map((v) => v.id);
    setOdabranaVozila(new Set(odgovarajuca));
  }

  async function handleSacuvajIzvestaj() {
    if (!nazivZaCuvanje.trim()) {
      setGreska("Unesi naziv za izveštaj.");
      return;
    }
    setCuvanje(true);
    setGreska("");

    const svaSelektovana = odabranaVozila.size === vozila.length;
    const payload = {
      naziv: nazivZaCuvanje.trim(),
      vozila_id: svaSelektovana ? null : Array.from(odabranaVozila),
      polja: { fields: CUSTOM_POLJA.filter((p) => odabranaPolja[p.key]).map((p) => p.key) },
    };

    const { error } = await supabase.from("izvestaji").insert(payload);
    setCuvanje(false);

    if (error) {
      setGreska("Greška pri čuvanju: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: `Sačuvan izveštaj "${payload.naziv}"`,
      tabela: "izvestaji",
      akcija: "dodavanje",
    });

    setNazivZaCuvanje("");
    load();
  }

  function handleUcitajIzvestaj(iz) {
    setAktivni("prilagodjeni");
    setOdabranaVozila(iz.vozila_id ? new Set(iz.vozila_id) : new Set(vozila.map((v) => v.id)));
    const nova = {};
    const polja = iz.polja?.fields || CUSTOM_POLJA.map((p) => p.key);
    CUSTOM_POLJA.forEach((p) => (nova[p.key] = polja.includes(p.key)));
    setOdabranaPolja(nova);
  }

  async function handleObrisiIzvestaj(iz) {
    if (!confirm(`Obrisati sačuvani izveštaj "${iz.naziv}"?`)) return;
    await supabase.from("izvestaji").delete().eq("id", iz.id);
    await zabeleziIzmenu(supabase, { opis: `Obrisan sačuvani izveštaj "${iz.naziv}"`, tabela: "izvestaji", akcija: "brisanje" });
    load();
  }

    if (loading) {
    return (
      <div>
        <h1 className="page-title">Izveštaji</h1>
        <p className="page-subtitle">Učitavanje...</p>

        <div className="kategorija-row">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-block" style={{ width: 130, height: 34, borderRadius: 999 }} />
          ))}
        </div>

        <div className="card">
          <Skeleton.Table rows={8} cols={7} />
        </div>
      </div>
    );
  }

  const brojStavki = izvestaj.redovi.length;
  const recStavki = brojStavki === 1 ? "stavka" : brojStavki < 5 ? "stavke" : "stavki";

  return (
    <div>
      <div className="print-only">
        <h1>{izvestaj.naslov}</h1>
        <div className="print-report-meta">
          {brojStavki} {recStavki} · generisano {new Date().toLocaleString("sr-RS")}
        </div>
        <table className="print-report-table">
          <thead>
            <tr>
              <th>#</th>
              {izvestaj.kolone.filter((k) => !k.checkbox).map((k) => <th key={k.key}>{k.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {izvestaj.redovi.map((red, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {izvestaj.kolone.filter((k) => !k.checkbox).map((k) => {
                  const vrednost = red[k.key];
                  if (k.pill && vrednost && typeof vrednost === "object") {
                    return <td key={k.key}>{vrednost.label}</td>;
                  }
                  return <td key={k.key}>{vrednost}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="no-print">
        <div className="toolbar">
          <div>
            <h1 className="page-title">Izveštaji</h1>
            <p className="page-subtitle">Predefinisani i prilagođeni izveštaji, sa mogućnošću štampe/izvoza u PDF.</p>
          </div>
        </div>

        <div className="kategorija-row">
          {PREDEFINISANI.map((p) => (
            <button
              key={p.key}
              className={`kategorija-btn ${aktivni === p.key ? "active" : ""}`}
              onClick={() => {
                setAktivni(p.key);
                setSortKey(null);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {aktivni === "rokovi" && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-field" style={{ maxWidth: 260 }}>
              <label>Broj dana unapred</label>
              <input type="number" value={danaUnapred} onChange={(e) => setDanaUnapred(e.target.value)} />
            </div>
          </div>
        )}

        {aktivni === "servisna-istorija" && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-field" style={{ maxWidth: 320 }}>
              <label>Vozilo</label>
              <select value={voziloFilterServis} onChange={(e) => setVoziloFilterServis(e.target.value)}>
                <option value="sve">— sva vozila —</option>
                {vozila.map((v) => (
                  <option key={v.id} value={v.id}>{v.marka_tip} · {v.registracija}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {aktivni === "obavezni-dokumenti" && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div className="form-field">
                <label>Pretraga</label>
                <input
                  placeholder="Registracija, marka, vozač..."
                  value={obavPretraga}
                  onChange={(e) => setObavPretraga(e.target.value)}
                />
              </div>
            </div>
            <div className="kategorija-row" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className={`kategorija-btn ${obavFilterStatus === "sve" ? "active" : ""}`}
                onClick={() => setObavFilterStatus("sve")}
              >
                Sve
              </button>
              <button
                type="button"
                className={`kategorija-btn ${obavFilterStatus === "problem" ? "active" : ""}`}
                onClick={() => setObavFilterStatus("problem")}
              >
                ✗ Samo sa problemom
              </button>
              <button
                type="button"
                className={`kategorija-btn ${obavFilterStatus === "kompletno" ? "active" : ""}`}
                onClick={() => setObavFilterStatus("kompletno")}
              >
                ✓ Samo kompletna
              </button>
              {obavSelektovana.size > 0 && (
                <span className="pill neutral" style={{ marginLeft: "auto" }}>
                  {obavSelektovana.size} izabrano
                </span>
              )}
            </div>
          </div>
        )}

        {aktivni === "prilagodjeni" && (
          <div className="card" style={{ marginBottom: 20 }}>
            <strong>Vozila u izveštaju</strong>

            <div style={{ marginTop: 10, marginBottom: 6, fontSize: 12, color: "var(--ink-soft)" }}>
              Brz izbor po kategoriji (može se odabrati više odjednom):
            </div>
            <div className="kategorija-row" style={{ marginBottom: 10 }}>
              {KATEGORIJE.map((k) => (
                <button
                  key={k.key}
                  type="button"
                  className={`kategorija-btn ${odabraneKategorije.has(k.key) ? "active" : ""}`}
                  onClick={() => toggleKategorija(k.key)}
                >
                  {k.label}
                </button>
              ))}
              <button type="button" className="btn secondary" onClick={primeniKategorije} disabled={odabraneKategorije.size === 0}>
                Primeni na izbor
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, margin: "10px 0" }}>
              <button type="button" className="btn secondary" onClick={() => svaVozila(true)}>Izaberi sva</button>
              <button type="button" className="btn secondary" onClick={() => svaVozila(false)}>Poništi sva</button>
            </div>
            <div className="settings-checkbox-grid" style={{ marginBottom: 20 }}>
              {vozila.map((v) => (
                <label key={v.id} className="settings-checkbox">
                  <input type="checkbox" checked={odabranaVozila.has(v.id)} onChange={() => toggleVozilo(v.id)} />
                  {v.registracija}
                </label>
              ))}
            </div>

            <strong>Podaci koji se prikazuju</strong>
            <div className="settings-checkbox-grid" style={{ marginTop: 10, marginBottom: 20 }}>
              {CUSTOM_POLJA.map((p) => (
                <label key={p.key} className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={!!odabranaPolja[p.key]}
                    onChange={(e) => setOdabranaPolja({ ...odabranaPolja, [p.key]: e.target.checked })}
                  />
                  {p.label}
                </label>
              ))}
            </div>

            <strong>Sačuvaj za ubuduće</strong>
            <div style={{ display: "flex", gap: 10, marginTop: 10, marginBottom: sacuvani.length ? 20 : 0, flexWrap: "wrap" }}>
              <input
                placeholder="Naziv izveštaja..."
                value={nazivZaCuvanje}
                onChange={(e) => setNazivZaCuvanje(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              />
              <button type="button" className="btn secondary" onClick={handleSacuvajIzvestaj} disabled={cuvanje}>
                <Save size={14} /> {cuvanje ? "Čuvanje..." : "Sačuvaj"}
              </button>
            </div>
            {greska && <div className="error-text" style={{ marginTop: 8 }}>{greska}</div>}

            {sacuvani.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {sacuvani.map((iz) => (
                  <div key={iz.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 14 }}>{iz.naziv}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="btn secondary" onClick={() => handleUcitajIzvestaj(iz)}>Učitaj</button>
                      <button type="button" className="btn secondary" onClick={() => handleObrisiIzvestaj(iz)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="card">
          <div className="toolbar" style={{ alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 15 }}>{izvestaj.naslov}</strong>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
                {brojStavki} {recStavki} · generisano {new Date().toLocaleString("sr-RS")}
              </div>

              {/* Sažetak — samo za "Obavezni dokumenti" */}
              {aktivni === "obavezni-dokumenti" && (() => {
                const ukupno = vozila.length;
                if (ukupno === 0) return null;
                let kompletno = 0, nedostaje1 = 0, nedostaje2plus = 0;
                vozila.forEach((v) => {
                  let n = 0;
                  TIPOVI_OBAVEZNI.forEach((t) => {
                    const s = t.tip === "sestomesecni_pregled"
                      ? statusSestomesecni(v, dokumenta)
                      : statusDokumentaMeta(dokumenta, v.id, t.tip, "vozilo_id");
                    if (s.tone === "danger" || s.tone === "warn") n++;
                  });
                  if (n === 0) kompletno++;
                  else if (n === 1) nedostaje1++;
                  else nedostaje2plus++;
                });
                return (
                  <div className="izvestaj-sazetak">
                    <div className="izvestaj-sazetak-item ok">
                      <span className="izvestaj-sazetak-label">✓ Kompletno</span>
                      <span className="izvestaj-sazetak-vrednost">
                        {kompletno} <span className="izvestaj-sazetak-proc">({((kompletno / ukupno) * 100).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="izvestaj-sazetak-item warn">
                      <span className="izvestaj-sazetak-label">⚠ Nedostaje 1</span>
                      <span className="izvestaj-sazetak-vrednost">
                        {nedostaje1} <span className="izvestaj-sazetak-proc">({((nedostaje1 / ukupno) * 100).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="izvestaj-sazetak-item danger">
                      <span className="izvestaj-sazetak-label">✗ Nedostaje 2+</span>
                      <span className="izvestaj-sazetak-vrednost">
                        {nedostaje2plus} <span className="izvestaj-sazetak-proc">({((nedostaje2plus / ukupno) * 100).toFixed(1)}%)</span>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <button className="btn secondary" onClick={handlePrint}>
              <Printer size={14} /> Štampaj / Izvezi PDF
            </button>
          </div>

          {izvestaj.redovi.length === 0 ? (
            <div className="empty-state">Nema podataka za prikaz u ovom izveštaju.</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    {izvestaj.kolone.map((k) => (
                      <th key={k.key} className={k.checkbox ? "" : "th-sortable"} onClick={() => !k.checkbox && toggleSort(k.key)}>
                        {k.label}
                        {sortKey === k.key && (sortSmer === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {izvestaj.redovi.map((red, i) => (
                    <tr key={i}>
                      <td data-label="#" className="mono">{i + 1}</td>
                      {izvestaj.kolone.map((k, idx) => {
                        const vrednost = red[k.key];
                        const jePrvaKolona = idx === 0 && !k.checkbox;

                        if (k.checkbox) {
                          return (
                            <td key={k.key} style={{ width: 32, textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={obavSelektovana.has(red._id)}
                                onChange={() => {
                                  setObavSelektovana((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(red._id)) next.delete(red._id);
                                    else next.add(red._id);
                                    return next;
                                  });
                                }}
                                style={{ cursor: "pointer" }}
                              />
                            </td>
                          );
                        }

                        return (
                          <td
                            key={k.key}
                            data-label={k.label}
                            className={jePrvaKolona ? "col-sticky-left" : undefined}
                          >
                            {k.pill && vrednost && typeof vrednost === "object" ? (
                              <span className={`pill ${vrednost.tone}`}>{vrednost.label}</span>
                            ) : (
                              vrednost
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}