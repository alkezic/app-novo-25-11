"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DocChip from "@/components/DocChip";
import { ucitajPodesavanja } from "@/lib/podesavanja";

const PRAZNI_TIPOVI = [
  { tip: "vozacka_dozvola", label: "DOZVOLA" },
  { tip: "lekarsko_uverenje", label: "LEKARSKO" },
  { tip: "tahograf_kartica", label: "TAHOGRAF K." },
];

// ime_prezime i Dokumenta su uvek prikazani; ostalo zavisi od podešavanja
const OPCIONE_KOLONE = [
  { key: "telefon", label: "Telefon", render: (v) => v.telefon || "—", mono: true },
  { key: "email", label: "Email", render: (v) => v.email || "—" },
  { key: "broj_vozacke", label: "Broj vozačke", render: (v) => v.broj_vozacke || "—", mono: true },
  { key: "kategorija", label: "Kategorija", render: (v) => v.kategorija || "—" },
  { key: "aktivan", label: "Aktivan", render: (v) => <span className={`pill ${v.aktivan ? "ok" : "neutral"}`}>{v.aktivan ? "Da" : "Ne"}</span> },
];

export default function VozaciPage() {
  return (
    <Suspense fallback={<div className="page-subtitle">Učitavanje...</div>}>
      <VozaciContent />
    </Suspense>
  );
}

function VozaciContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [vozaci, setVozaci] = useState([]);
  const [docMap, setDocMap] = useState({});
  const [prikaz, setPrikaz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pretraga, setPretraga] = useState(searchParams.get("q") || "");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data }, { data: docs }, podesavanja] = await Promise.all([
      supabase.from("vozaci").select("*").order("ime_prezime", { ascending: true }),
      supabase
        .from("dokumenta")
        .select("id, vozac_id, tip, fajl_url, created_at")
        .in("tip", PRAZNI_TIPOVI.map((t) => t.tip))
        .not("vozac_id", "is", null)
        .order("created_at", { ascending: false }),
      ucitajPodesavanja(supabase),
    ]);
    setVozaci(data || []);
    setPrikaz(podesavanja.prikaz_vozaci);

    const map = {};
    (docs || []).forEach((d) => {
      const key = `${d.vozac_id}__${d.tip}`;
      if (!map[key] || (!map[key].fajl_url && d.fajl_url)) {
        map[key] = d;
      }
    });
    setDocMap(map);
    setLoading(false);
  }

  const kolone = useMemo(() => {
    if (!prikaz) return [];
    return OPCIONE_KOLONE.filter((k) => prikaz[k.key] !== false);
  }, [prikaz]);

  const prikazani = useMemo(() => {
    if (!pretraga.trim()) return vozaci;
    const q = pretraga.toLowerCase();
    return vozaci.filter((v) =>
      [v.ime_prezime, v.telefon, v.email, v.broj_vozacke, v.kategorija, v.napomena]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(q))
    );
  }, [vozaci, pretraga]);

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Vozači</h1>
          <p className="page-subtitle">Evidencija vozača, vozačkih dozvola, lekarskih uverenja i tahograf kartica.</p>
        </div>
        <Link href="/administracija" className="btn secondary">+ Novi vozač</Link>
      </div>

      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <input
            placeholder="Pretraga po imenu, telefonu, broju vozačke..."
            value={pretraga}
            onChange={(e) => setPretraga(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {loading ? (
          <div className="empty-state">Učitavanje...</div>
        ) : prikazani.length === 0 ? (
          <div className="empty-state">
            {vozaci.length === 0 ? "Još uvek nema unetih vozača. Dodaj vozača u Administraciji." : "Nema vozača koji odgovaraju pretrazi."}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Ime i prezime</th>
                  {kolone.map((k) => <th key={k.key}>{k.label}</th>)}
                  <th>Dokumenta</th>
                  <th className="col-sticky-right"></th>
                </tr>
              </thead>
              <tbody>
                {prikazani.map((v) => (
                  <tr key={v.id}>
                    <td data-label="Ime i prezime" className="cell-strong">{v.ime_prezime}</td>
                    {kolone.map((k) => (
                      <td key={k.key} data-label={k.label} className={k.mono ? "mono" : undefined}>
                        {k.render(v)}
                      </td>
                    ))}
                    <td data-label="Dokumenta" className="cell-block">
                      <div className="doc-chip-row">
                        {PRAZNI_TIPOVI.map((t) => (
                          <DocChip
                            key={t.tip}
                            vozioId={null}
                            vozacId={v.id}
                            tip={t.tip}
                            label={t.label}
                            vozacIme={v.ime_prezime}
                            doc={docMap[`${v.id}__${t.tip}`]}
                            onChanged={load}
                          />
                        ))}
                      </div>
                    </td>
                    <td data-label="" className="cell-block col-sticky-right">
                      <Link href={`/vozaci/${v.id}`} className="btn secondary">
                        <Eye size={14} /> Pregled
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
