"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, ArrowUp, ArrowDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DocChip from "@/components/DocChip";
import { ucitajPodesavanja } from "@/lib/podesavanja";
import StatusPill, { rokStatus } from "@/components/StatusPill";
import Skeleton from "@/components/Skeleton";

const PRAZNI_TIPOVI = [
  { tip: "registracija", label: "SAOB" },
  { tip: "kasko", label: "KASKO" },
  { tip: "staklo", label: "STAKLO" },
  { tip: "AO", label: "AO" },
  { tip: "tahograf", label: "TAHOGRAF", zahtevaDatum: true },
  { tip: "ams", label: "AMS" },
  { tip: "coc", label: "COC" },
  { tip: "sestomesecni_pregled", label: "6-MES. PREGLED", zahtevaDatum: true },
];

const KATEGORIJE = [
  { key: "sve", label: "Sve", test: () => true },
  { key: "minibus", label: "Minibus", test: (n) => n != null && n <= 22 },
  { key: "midibus", label: "Midibus", test: (n) => n != null && n >= 23 && n <= 40 },
  { key: "autobus", label: "Autobus", test: (n) => n != null && n >= 41 && n <= 70 },
  { key: "deker", label: "Deker", test: (n) => n != null && n >= 71 },
];

const OPCIONE_KOLONE = [
  { key: "marka_tip", label: "Marka i tip", render: (v) => v.marka_tip, wrap: true },
  { key: "vrsta_vozila", label: "Vrsta", render: (v) => v.vrsta_vozila || "—" },
  { key: "broj_sedista", label: "Sedišta", render: (v) => v.broj_sedista ?? "—", mono: true },
  { key: "vozac", label: "Vozač", render: (v) => v.vozaci?.ime_prezime || v.vozac || "—" },
  { key: "vlasnistvo", label: "Vlasništvo", render: (v) => v.vlasnistvo || "—" },
  { key: "aktivno", label: "Aktivno", render: (v) => <span className={`pill ${v.aktivno ? "ok" : "neutral"}`}>{v.aktivno ? "Da" : "Ne"}</span> },
  {
    key: "u_voznom_parku",
    label: "U voznom parku",
    render: (v) => {
      if (!v.u_voznom_parku) return "—";
      const tone = /istek/i.test(v.u_voznom_parku) ? "danger" : v.u_voznom_parku.toUpperCase() === "DA" ? "ok" : "warn";
      return <span className={`pill ${tone}`}>{v.u_voznom_parku}</span>;
    },
  },
  {
    key: "istek_registracije",
    label: "Istek registracije",
    render: (v) => {
      if (!v.istek_registracije) return "—";
      const s = rokStatus(v.istek_registracije);
      return <StatusPill label={new Date(v.istek_registracije).toLocaleDateString("sr-RS")} tone={s.tone} />;
    },
  },
];

export default function VozilaPage() {
  return (
    <Suspense fallback={<div className="page-subtitle">Učitavanje...</div>}>
      <VozilaContent />
    </Suspense>
  );
}

function VozilaContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [vozila, setVozila] = useState([]);
  const [docMap, setDocMap] = useState({});
  const [prikaz, setPrikaz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pretraga, setPretraga] = useState(searchParams.get("q") || "");
  const [kategorija, setKategorija] = useState("sve");
  const [sortKey, setSortKey] = useState(null);
  const [sortSmer, setSortSmer] = useState("asc");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data }, { data: docs }, podesavanja] = await Promise.all([
      supabase.from("vozila").select("*, vozaci(ime_prezime)").order("created_at", { ascending: false }),
      supabase
        .from("dokumenta")
        .select("id, vozilo_id, tip, fajl_url, datum_isteka, created_at")
        .in("tip", PRAZNI_TIPOVI.map((t) => t.tip))
        .order("created_at", { ascending: false }),
      ucitajPodesavanja(supabase),
    ]);
    setVozila(data || []);
    setPrikaz(podesavanja.prikaz_vozila);

    const map = {};
    (docs || []).forEach((d) => {
      const key = `${d.vozilo_id}__${d.tip}`;
      if (!map[key] || (!map[key].fajl_url && d.fajl_url)) {
        map[key] = d;
      }
    });
    setDocMap(map);
    setLoading(false);
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortSmer((s) => (s === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortSmer("asc");
    }
  }

  const kolone = useMemo(() => {
    if (!prikaz) return [];
    return OPCIONE_KOLONE.filter((k) => prikaz[k.key] !== false);
  }, [prikaz]);

  const prikazana = useMemo(() => {
    let rows = vozila;

    const kat = KATEGORIJE.find((k) => k.key === kategorija);
    if (kat && kategorija !== "sve") {
      rows = rows.filter((v) => kat.test(v.broj_sedista));
    }

    if (pretraga.trim()) {
      const q = pretraga.toLowerCase();
      rows = rows.filter((v) =>
        [v.registracija, v.marka_tip, v.vin, v.vrsta_vozila, v.vozac, v.napomena, v.lizing_br_ugovora]
          .filter(Boolean)
          .some((val) => val.toLowerCase().includes(q))
      );
    }

    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        let av = a[sortKey];
        let bv = b[sortKey];
        if (typeof av === "boolean") { av = av ? 1 : 0; bv = bv ? 1 : 0; }
        if (av == null) av = "";
        if (bv == null) bv = "";
        if (typeof av === "string") av = av.toLowerCase();
        if (typeof bv === "string") bv = bv.toLowerCase();
        if (av < bv) return sortSmer === "asc" ? -1 : 1;
        if (av > bv) return sortSmer === "asc" ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [vozila, pretraga, kategorija, sortKey, sortSmer]);

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Vozila</h1>
          <p className="page-subtitle">Evidencija vozila u voznom parku.</p>
        </div>
      </div>

      <div className="kategorija-row">
        {KATEGORIJE.map((k) => (
          <button
            key={k.key}
            className={`kategorija-btn ${kategorija === k.key ? "active" : ""}`}
            onClick={() => setKategorija(k.key)}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <input
            placeholder="Pretraga po registraciji, marki, VIN-u, vozaču, napomeni..."
            value={pretraga}
            onChange={(e) => setPretraga(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {loading ? (
          <Skeleton.Table rows={8} cols={7} />
        ) : prikazana.length === 0 ? (
          <div className="empty-state">
            {vozila.length === 0 ? "Još uvek nema unetih vozila. Dodaj vozilo u Administraciji." : "Nema vozila koja odgovaraju filteru."}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th className="th-sortable" onClick={() => toggleSort("registracija")}>
                    Registracija
                    {sortKey === "registracija" && (sortSmer === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                  </th>
                  {kolone.map((k) => (
                    <th key={k.key} className="th-sortable" onClick={() => toggleSort(k.key)}>
                      {k.label}
                      {sortKey === k.key && (sortSmer === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                    </th>
                  ))}
                  <th>Dokumenta</th>
                  <th className="col-sticky-right"></th>
                </tr>
              </thead>
              <tbody>
                {prikazana.map((v) => (
                  <tr key={v.id}>
                    <td data-label="Registracija" className="mono cell-strong">{v.registracija}</td>
                    {kolone.map((k) => (
                      <td key={k.key} data-label={k.label} className={k.mono ? "mono" : k.wrap ? "cell-wrap" : undefined}>
                        {k.render(v)}
                      </td>
                    ))}
                    <td data-label="Dokumenta" className="cell-block">
                      <div className="doc-chip-row">
                        {PRAZNI_TIPOVI.map((t) => (
                          <DocChip
                            key={t.tip}
                            vozioId={v.id}
                            tip={t.tip}
                            label={t.label}
                            zahtevaDatum={t.zahtevaDatum}
                            voziloOznaka={v.registracija}
                            doc={docMap[`${v.id}__${t.tip}`]}
                            onChanged={load}
                          />
                        ))}
                      </div>
                    </td>
                    <td data-label="" className="cell-block col-sticky-right">
                      <Link href={`/vozila/${v.id}`} className="btn-icon" title="Pregled vozila">
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}