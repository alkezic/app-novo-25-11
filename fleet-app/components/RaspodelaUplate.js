"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { zabeleziIzmenu } from "@/lib/log";
import { formatIznos } from "@/lib/finansije";

// tipRacuna: 'izlazni' za uplate koje primamo (placanje.tip='primljena'),
// 'ulazni' za isplate koje mi šaljemo (placanje.tip='poslata')
export default function RaspodelaUplate({ placanje, tipRacuna, predlogRedovi, onChanged }) {
  const supabase = createClient();
  const [postojece, setPostojece] = useState([]);
  const [otvoreniRacuni, setOtvoreniRacuni] = useState([]);
  const [noviRedovi, setNoviRedovi] = useState(predlogRedovi || []);
  const [dodajRacunId, setDodajRacunId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placanje.id]);

  async function load(resetNovi = true) {
    setLoading(true);
    const [{ data: raspodele }, { data: racuni }] = await Promise.all([
      supabase.from("raspodele_uplata").select("*, racuni(broj_racuna, iznos, valuta)").eq("placanje_id", placanje.id).order("created_at", { ascending: false }),
      supabase
        .from("v_racuni_stanje")
        .select("*")
        .eq("tip", tipRacuna)
        .eq("partner_id", placanje.partner_id)
        .neq("status", "placeno")
        .neq("status", "storniran")
        .order("datum_valute", { ascending: true }),
    ]);
    setPostojece(raspodele || []);
    setOtvoreniRacuni(racuni || []);
    if (resetNovi) setNoviRedovi([]);
    setLoading(false);
  }

  const vecRasporedjenoId = new Set(postojece.map((p) => p.racun_id));
  const rasporedjenoUkupno = postojece.reduce((s, p) => s + Number(p.iznos), 0);
  const uNovimRedovima = noviRedovi.reduce((s, r) => s + Number(r.iznos || 0), 0);
  const neraspodeljenoSada = Number(placanje.iznos) - rasporedjenoUkupno - uNovimRedovima;

  function dodajRed() {
    const racun = otvoreniRacuni.find((r) => r.id === dodajRacunId);
    if (!racun || vecRasporedjenoId.has(racun.id) || noviRedovi.some((r) => r.racun.id === racun.id)) return;
    const preostaloUplate = Number(placanje.iznos) - rasporedjenoUkupno - uNovimRedovima;
    const predlog = Math.max(0, Math.min(Number(racun.preostalo), preostaloUplate));
    setNoviRedovi([...noviRedovi, { racun, iznos: predlog.toFixed(2) }]);
    setDodajRacunId("");
  }

  function ukloniRed(idx) {
    setNoviRedovi(noviRedovi.filter((_, i) => i !== idx));
  }

  function izmeniIznos(idx, vrednost) {
    setNoviRedovi(noviRedovi.map((r, i) => (i === idx ? { ...r, iznos: vrednost } : r)));
  }

  async function handleSacuvajRaspodelu() {
    setSaving(true);
    setError("");

    const zaUnos = noviRedovi.filter((r) => Number(r.iznos) > 0);
    if (zaUnos.length === 0) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("raspodele_uplata").insert(
      zaUnos.map((r) => ({
        placanje_id: placanje.id,
        racun_id: r.racun.id,
        iznos: Number(r.iznos),
        kurs_koriscen: placanje.kurs || 1,
      }))
    );
    setSaving(false);

    if (error) {
      setError("Greška pri čuvanju: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: `Raspoređena uplata (${formatIznos(placanje.iznos, placanje.valuta)}) na ${zaUnos.length} račun(a)`,
      tabela: "raspodele_uplata",
      akcija: "dodavanje",
    });

    load();
    onChanged?.();
  }

  async function handleStornirajRaspodelu(r) {
    if (!confirm("Ukloniti ovu raspodelu? Iznos se vraća u neraspoređeno.")) return;
    await supabase.from("raspodele_uplata").delete().eq("id", r.id);
    await zabeleziIzmenu(supabase, {
      opis: `Uklonjena raspodela uplate na račun ${r.racuni?.broj_racuna || ""}`,
      tabela: "raspodele_uplata",
      akcija: "brisanje",
    });
    load();
    onChanged?.();
  }

  if (loading) return <div className="empty-state">Učitavanje...</div>;

  return (
    <div>
      <div className="grid-stats" style={{ marginBottom: 16 }}>
        <div className="stat">
          <div className="stat-label">Ukupno</div>
          <div className="stat-value mono">{formatIznos(placanje.iznos, placanje.valuta)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Raspoređeno</div>
          <div className="stat-value mono">{formatIznos(rasporedjenoUkupno, placanje.valuta)}</div>
        </div>
        <div className={`stat ${neraspodeljenoSada > 0 ? "warn" : ""}`}>
          <div className="stat-label">Neraspoređeno</div>
          <div className="stat-value mono">{formatIznos(neraspodeljenoSada, placanje.valuta)}</div>
        </div>
      </div>

      {postojece.length > 0 && (
        <div className="table-scroll" style={{ marginBottom: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Račun</th>
                <th>Raspoređeno</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {postojece.map((r) => (
                <tr key={r.id}>
                  <td data-label="Račun" className="mono">
                    <Link href={`/finansije/racuni/${r.racun_id}`}>{r.racuni?.broj_racuna || "—"}</Link>
                  </td>
                  <td data-label="Raspoređeno" className="mono">{formatIznos(r.iznos, r.racuni?.valuta)}</td>
                  <td data-label="" className="cell-block">
                    <button className="btn secondary" onClick={() => handleStornirajRaspodelu(r)}>Ukloni</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {noviRedovi.length > 0 && (
        <div className="table-scroll" style={{ marginBottom: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Račun (novo)</th>
                <th>Iznos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {noviRedovi.map((r, idx) => (
                <tr key={r.racun.id}>
                  <td data-label="Račun" className="mono">{r.racun.broj_racuna}</td>
                  <td data-label="Iznos">
                    <input type="number" step="0.01" value={r.iznos} onChange={(e) => izmeniIznos(idx, e.target.value)} style={{ maxWidth: 140 }} />
                  </td>
                  <td data-label="" className="cell-block">
                    <button className="btn secondary" onClick={() => ukloniRed(idx)}>Ukloni</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {otvoreniRacuni.filter((r) => !vecRasporedjenoId.has(r.id) && !noviRedovi.some((n) => n.racun.id === r.id)).length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <select value={dodajRacunId} onChange={(e) => setDodajRacunId(e.target.value)} style={{ flex: 1, minWidth: 220 }}>
            <option value="">+ Dodaj račun...</option>
            {otvoreniRacuni
              .filter((r) => !vecRasporedjenoId.has(r.id) && !noviRedovi.some((n) => n.racun.id === r.id))
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.broj_racuna || "bez broja"} · preostalo {formatIznos(r.preostalo, r.valuta)}
                </option>
              ))}
          </select>
          <button type="button" className="btn secondary" onClick={dodajRed} disabled={!dodajRacunId}>Dodaj</button>
        </div>
      )}

      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

      {noviRedovi.length > 0 && (
        <button className="btn" onClick={handleSacuvajRaspodelu} disabled={saving}>
          {saving ? "Čuvanje..." : "Sačuvaj raspodelu"}
        </button>
      )}
    </div>
  );
}
