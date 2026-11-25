"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import StatusPill, { rokStatus } from "@/components/StatusPill";
import { nazivTipaDokumenta } from "@/lib/tipDokumenta";
import { ucitajPodesavanja } from "@/lib/podesavanja";
import { formatDatum } from "@/lib/datum";
import Skeleton from "@/components/Skeleton";

const KATEGORIJE = [
  { key: "minibus", label: "Minibus", sublabel: "do 22 sedišta", test: (n) => n != null && n <= 22 },
  { key: "midibus", label: "Midibus", sublabel: "23–40 sedišta", test: (n) => n != null && n >= 23 && n <= 40 },
  { key: "autobus", label: "Autobus", sublabel: "41–70 sedišta", test: (n) => n != null && n >= 41 && n <= 70 },
  { key: "deker", label: "Deker", sublabel: "71+ sedišta", test: (n) => n != null && n >= 71 },
  { key: "nepoznato", label: "Bez podatka", sublabel: "nije uneto sedišta", test: (n) => n == null },
];

function dodajMesece(datum, brojMeseci) {
  const d = new Date(datum);
  d.setMonth(d.getMonth() + brojMeseci);
  return d;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [vozila, setVozila] = useState([]);
  const [rokovi, setRokovi] = useState([]);
  const [blizuServisa, setBlizuServisa] = useState([]);
  const [bezSestomesecnog, setBezSestomesecnog] = useState([]);
  const [podesavanja, setPodesavanja] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const p = await ucitajPodesavanja(supabase);
    setPodesavanja(p);

    const danas = new Date();
    danas.setHours(0, 0, 0, 0);
    const zaRokDana = new Date(danas);
    zaRokDana.setDate(zaRokDana.getDate() + p.prag_rokovi_dana);
    const granica = zaRokDana.toISOString().slice(0, 10);

    const [{ data: v }, { data: d }, { data: vReg }, { data: s }, { data: pregledi }] = await Promise.all([
      supabase.from("vozila").select("id, registracija, marka_tip, broj_sedista, aktivno, u_voznom_parku, vlasnistvo, istek_registracije"),
      supabase
        .from("v_dokumenta_sa_vlasnikom")
        .select("*")
        .lte("datum_isteka", granica)
        .order("datum_isteka", { ascending: true }),
      supabase
        .from("vozila")
        .select("id, registracija, marka_tip, istek_registracije")
        .not("istek_registracije", "is", null)
        .lte("istek_registracije", granica),
      supabase
        .from("v_status_servisa")
        .select("*")
        .not("preostalo_km", "is", null)
        .lte("preostalo_km", p.prag_servis_km)
        .order("preostalo_km", { ascending: true }),
      supabase.from("dokumenta").select("vozilo_id, datum_izdavanja").eq("tip", "sestomesecni_pregled").not("datum_izdavanja", "is", null),
    ]);

    const registracijeKaoRokovi = (vReg || []).map((v) => ({
      id: `reg-${v.id}`,
      tipLabel: "Istek registracije",
      datum_isteka: v.istek_registracije,
      vozilo_registracija: v.registracija,
      vozilo_marka_tip: v.marka_tip,
      vozac_ime_prezime: null,
    }));

    const spojenoRokovi = [...(d || []), ...registracijeKaoRokovi].sort(
      (a, b) => new Date(a.datum_isteka) - new Date(b.datum_isteka)
    );

    const najnovijiPregledPoVozilu = {};
    (pregledi || []).forEach((p) => {
      const postojeci = najnovijiPregledPoVozilu[p.vozilo_id];
      if (!postojeci || new Date(p.datum_izdavanja) > new Date(postojeci)) {
        najnovijiPregledPoVozilu[p.vozilo_id] = p.datum_izdavanja;
      }
    });

    const bezPregleda = (v || [])
      .filter((voz) => voz.istek_registracije)
      .map((voz) => {
        const rok = dodajMesece(voz.istek_registracije, -6);
        const pocetakCiklusa = dodajMesece(voz.istek_registracije, -12);
        const poslednji = najnovijiPregledPoVozilu[voz.id];
        const uradjenUCiklusu = poslednji && new Date(poslednji) >= pocetakCiklusa;
        return { ...voz, rokSestomesecnog: rok, uradjenUCiklusu };
      })
      .filter((voz) => !voz.uradjenUCiklusu && danas >= voz.rokSestomesecnog)
      .sort((a, b) => a.rokSestomesecnog - b.rokSestomesecnog);

    setVozila(v || []);
    setRokovi(spojenoRokovi);
    setBlizuServisa(s || []);
    setBezSestomesecnog(bezPregleda);
    setLoading(false);
  }

   if (loading || !podesavanja) {
    return (
      <div>
        <h1 className="page-title">Pregled</h1>
        <p className="page-subtitle">Učitavanje...</p>

        <Skeleton.Cards count={4} />

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="skeleton-block" style={{ width: "30%", height: 14, marginBottom: 16 }} />
          <Skeleton.List rows={4} />
        </div>

        <div className="card">
          <div className="skeleton-block" style={{ width: "40%", height: 14, marginBottom: 16 }} />
          <Skeleton.Table rows={5} cols={4} />
        </div>
      </div>
    );
  }

  const danas = new Date();
  const pp = podesavanja.prikaz_pregled;

  const poKategoriji = KATEGORIJE.map((k) => ({ ...k, broj: vozila.filter((v) => k.test(v.broj_sedista)).length }));
  const uVoznomParku = vozila.filter((v) => (v.u_voznom_parku || "").toUpperCase() === "DA").length;
  const aktivnaBroj = vozila.filter((v) => v.aktivno).length;
  const sopstvenaBroj = vozila.filter((v) => v.vlasnistvo === "sopstveno").length;
  const lizingBroj = vozila.filter((v) => v.vlasnistvo === "lizing").length;
  const ukupnoSedista = vozila.reduce((s, v) => s + (v.broj_sedista || 0), 0);

  return (
    <div>
      <h1 className="page-title">Pregled</h1>
      <p className="page-subtitle">Stanje voznog parka na dan {formatDatum(danas)}.</p>

      <div className="grid-stats">
        {pp.stat_vozila && (
          <div className="stat">
            <div className="stat-label">Vozila</div>
            <div className="stat-value">{vozila.length}</div>
          </div>
        )}
        {pp.stat_dokumenta && (
          <div className={`stat ${rokovi.length ? "warn" : ""}`}>
            <div className="stat-label">Rokovi koji ističu (≤{podesavanja.prag_rokovi_dana}d)</div>
            <div className="stat-value">{rokovi.length}</div>
          </div>
        )}
        {pp.stat_servis && (
          <div className={`stat ${blizuServisa.length ? "warn" : ""}`}>
            <div className="stat-label">Blizu redovnog servisa (≤{podesavanja.prag_servis_km.toLocaleString("sr-RS")}km)</div>
            <div className="stat-value">{blizuServisa.length}</div>
          </div>
        )}
        {pp.stat_sestomesecni !== false && (
          <div className={`stat ${bezSestomesecnog.length ? "danger" : ""}`}>
            <div className="stat-label">Bez urađenog šestomesečnog pregleda</div>
            <div className="stat-value">{bezSestomesecnog.length}</div>
          </div>
        )}
      </div>

      {pp.sekcija_sastav && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="toolbar">
            <strong>Sastav flote</strong>
          </div>

          <div className="grid-stats" style={{ marginBottom: 18 }}>
            {poKategoriji.map((k) => (
              <div className="stat" key={k.key}>
                <div className="stat-label">{k.label} <span style={{ textTransform: "none", fontWeight: 400 }}>· {k.sublabel}</span></div>
                <div className="stat-value">{k.broj}</div>
              </div>
            ))}
          </div>

          <div className="sastav-flote-red">
            <div className="sastav-flote-par">
              <span className="pill ok">{uVoznomParku} u voznom parku</span>
              <span className="pill neutral">{vozila.length - uVoznomParku} van voznog parka</span>
            </div>
            <div className="sastav-flote-par">
              <span className="pill ok">{aktivnaBroj} aktivno</span>
              <span className="pill neutral">{vozila.length - aktivnaBroj} neaktivno</span>
            </div>
            <div className="sastav-flote-par">
              <span className="pill ok">{sopstvenaBroj} sopstveno</span>
              <span className="pill warn">{lizingBroj} lizing</span>
            </div>
            <div className="sastav-flote-par">
              <span className="pill neutral">Ukupan kapacitet: {ukupnoSedista.toLocaleString("sr-RS")} sedišta</span>
            </div>
          </div>
        </div>
      )}

      {pp.sekcija_sestomesecni !== false && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="toolbar">
            <strong>Vozila bez urađenog šestomesečnog pregleda</strong>
          </div>
          <p className="page-subtitle" style={{ marginTop: -8, marginBottom: 14 }}>
            Pregled dospeva na pola registracionog perioda (6 meseci pre isteka registracije).
          </p>
          {bezSestomesecnog.length === 0 ? (
            <div className="empty-state">Sva vozila sa poznatim datumom registracije imaju urađen pregled u tekućem ciklusu.</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Vozilo</th>
                    <th>Istek registracije</th>
                    <th>Rok za pregled</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bezSestomesecnog.map((v) => {
                    const s = rokStatus(v.rokSestomesecnog);
                    return (
                      <tr key={v.id}>
                        <td data-label="Vozilo">{v.marka_tip} · {v.registracija}</td>
                        <td data-label="Istek registracije" className="mono">{formatDatum(v.istek_registracije)}</td>
                        <td data-label="Rok za pregled" className="mono">{formatDatum(v.rokSestomesecnog)}</td>
                        <td data-label="Status"><StatusPill label={s.label} tone={s.tone} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {pp.sekcija_dokumenta && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="toolbar">
            <strong>Rokovi koji ističu (dokumenta i registracije)</strong>
            <Link href="/dokumenta" className="btn secondary">Sva dokumenta</Link>
          </div>
          {rokovi.length === 0 ? (
            <div className="empty-state">Nema rokova koji ističu u narednih {podesavanja.prag_rokovi_dana} dana.</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Odnosi se na</th>
                    <th>Tip</th>
                    <th>Ističe</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rokovi.map((d) => {
                    const s = rokStatus(d.datum_isteka);
                    return (
                      <tr key={d.id}>
                        <td data-label="Odnosi se na">
                          {d.vozilo_registracija ? `${d.vozilo_marka_tip} · ${d.vozilo_registracija}` : d.vozac_ime_prezime ? `${d.vozac_ime_prezime} (vozač)` : "—"}
                        </td>
                        <td data-label="Tip">{d.tipLabel || nazivTipaDokumenta(d.tip)}</td>
                        <td data-label="Ističe" className="mono">{d.datum_isteka ? formatDatum(d.datum_isteka) : "—"}</td>
                        <td data-label="Status"><StatusPill label={s.label} tone={s.tone} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {pp.sekcija_servis && (
        <div className="card">
          <div className="toolbar">
            <strong>Vozila blizu redovnog servisa</strong>
          </div>
          {blizuServisa.length === 0 ? (
            <div className="empty-state">Nijedno vozilo trenutno nije blizu redovnog servisa (na osnovu unetih podataka o kilometraži).</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Vozilo</th>
                    <th>Trenutna kilometraža</th>
                    <th>Sledeći servis (km)</th>
                    <th>Preostalo</th>
                  </tr>
                </thead>
                <tbody>
                  {blizuServisa.map((b) => (
                    <tr key={b.vozilo_id}>
                      <td data-label="Vozilo">{b.marka_tip} · {b.registracija}</td>
                      <td data-label="Trenutna kilometraža" className="mono">{b.trenutna_km?.toLocaleString("sr-RS")}</td>
                      <td data-label="Sledeći servis (km)" className="mono">{b.cilj_km?.toLocaleString("sr-RS")}</td>
                      <td data-label="Preostalo">
                        <span className={`pill ${b.preostalo_km <= 0 ? "danger" : "warn"}`}>
                          {b.preostalo_km <= 0 ? `Prekoračeno ${Math.abs(b.preostalo_km).toLocaleString("sr-RS")}km` : `${b.preostalo_km.toLocaleString("sr-RS")}km`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}