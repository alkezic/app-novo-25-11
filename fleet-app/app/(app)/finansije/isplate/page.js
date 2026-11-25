"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { zabeleziIzmenu } from "@/lib/log";
import { formatIznos, prepoznajRacuneIzNapomene } from "@/lib/finansije";
import RaspodelaUplate from "@/components/RaspodelaUplate";

const PRAZAN = {
  datum: new Date().toISOString().slice(0, 10),
  partner_id: "",
  iznos: "",
  valuta: "RSD",
  kurs: "1",
  banka_racun_id: "",
  referenca: "",
  napomena: "",
  autoRasknjizi: true,
};

export default function IsplateDobavljacimaPage() {
  const supabase = createClient();
  const [placanja, setPlacanja] = useState([]);
  const [partneri, setPartneri] = useState([]);
  const [banke, setBanke] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(PRAZAN);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [pregled, setPregled] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: partn }, { data: b }] = await Promise.all([
      supabase.from("v_placanja_stanje").select("*, partneri(naziv)").eq("tip", "poslata").order("datum", { ascending: false }),
      supabase.from("partneri").select("id, naziv").order("naziv"),
      supabase.from("banke_racuni").select("id, naziv"),
    ]);
    setPlacanja(p || []);
    setPartneri(partn || []);
    setBanke(b || []);
    setLoading(false);
  }

  async function izracunajPredlog(placanjeRed) {
    const { data: sviRacuni } = await supabase
      .from("v_racuni_stanje")
      .select("*")
      .eq("tip", "ulazni")
      .eq("partner_id", placanjeRed.partner_id)
      .order("datum_valute", { ascending: true });

    const svi = sviRacuni || [];
    const otvoreni = svi.filter((r) => r.status !== "placeno" && r.status !== "storniran");

    let kandidati = [];
    const upozorenja = [];

    if (form.napomena.trim()) {
      const nadjeni = prepoznajRacuneIzNapomene(form.napomena, svi);
      nadjeni.forEach((r) => {
        if (r.status === "placeno") upozorenja.push(`Račun ${r.broj_racuna} je već u potpunosti plaćen — preskočen.`);
        else if (r.status === "storniran") upozorenja.push(`Račun ${r.broj_racuna} je storniran — preskočen.`);
        else kandidati.push(r);
      });
    }

    if (form.autoRasknjizi) {
      const ostali = otvoreni.filter((r) => !kandidati.some((k) => k.id === r.id));
      kandidati = [...kandidati, ...ostali];
    }

    let preostaloUplate = Number(placanjeRed.iznos);
    const predlogRedovi = [];
    for (const racun of kandidati) {
      if (preostaloUplate <= 0) break;
      const iznos = Math.min(Number(racun.preostalo), preostaloUplate);
      if (iznos > 0) {
        predlogRedovi.push({ racun, iznos: iznos.toFixed(2) });
        preostaloUplate -= iznos;
      }
    }

    return { predlogRedovi, upozorenja };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      tip: "poslata",
      partner_id: form.partner_id || null,
      banka_racun_id: form.banka_racun_id || null,
      datum: form.datum,
      iznos: Number(form.iznos),
      valuta: form.valuta,
      kurs: Number(form.kurs) || 1,
      referenca: form.referenca || null,
      napomena: form.napomena || null,
    };

    const { data, error } = await supabase.from("placanja").insert(payload).select().single();
    setSaving(false);

    if (error) {
      setError("Greška pri čuvanju: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: `Evidentirana isplata ${formatIznos(payload.iznos, payload.valuta)}`,
      tabela: "placanja",
      akcija: "dodavanje",
    });

    const { predlogRedovi, upozorenja } = await izracunajPredlog(data);

    setForm(PRAZAN);
    setShowForm(false);
    load();
    setPregled({ placanje: data, predlogRedovi, upozorenja });
  }

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Uplate dobavljačima</h1>
          <p className="page-subtitle">Evidencija isplata i njihovo rasknjižavanje na primljene račune.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Otkaži" : "+ Nova isplata"}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="form-grid">
            <div className="form-field">
              <label>Datum</label>
              <input type="date" required value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Partner (dobavljač)</label>
              <select required value={form.partner_id} onChange={(e) => setForm({ ...form, partner_id: e.target.value })}>
                <option value="">— izaberi partnera —</option>
                {partneri.map((p) => <option key={p.id} value={p.id}>{p.naziv}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Iznos</label>
              <input type="number" step="0.01" required value={form.iznos} onChange={(e) => setForm({ ...form, iznos: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Valuta</label>
              <select value={form.valuta} onChange={(e) => setForm({ ...form, valuta: e.target.value })}>
                <option value="RSD">RSD</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="form-field">
              <label>Banka</label>
              <select value={form.banka_racun_id} onChange={(e) => setForm({ ...form, banka_racun_id: e.target.value })}>
                <option value="">— nije uneto —</option>
                {banke.map((b) => <option key={b.id} value={b.id}>{b.naziv}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Broj izvoda / referenca</label>
              <input value={form.referenca} onChange={(e) => setForm({ ...form, referenca: e.target.value })} />
            </div>
          </div>
          <div className="form-field" style={{ marginBottom: 14 }}>
            <label>Napomena (možeš navesti brojeve računa)</label>
            <textarea rows={2} value={form.napomena} onChange={(e) => setForm({ ...form, napomena: e.target.value })} />
          </div>
          <label className="settings-checkbox" style={{ marginBottom: 16 }}>
            <input type="checkbox" checked={form.autoRasknjizi} onChange={(e) => setForm({ ...form, autoRasknjizi: e.target.checked })} />
            Automatski rasporedi ostatak po starosti ako nije sve pokriveno napomenom
          </label>
          {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Čuvanje..." : "Sačuvaj i rasknjiži"}
          </button>
        </form>
      )}

      {pregled && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="toolbar">
            <strong>Predlog raspodele</strong>
            <button className="btn secondary" onClick={() => setPregled(null)}>Zatvori</button>
          </div>
          {pregled.upozorenja.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {pregled.upozorenja.map((u, i) => (
                <div key={i} className="error-text" style={{ marginBottom: 4 }}>⚠️ {u}</div>
              ))}
            </div>
          )}
          <RaspodelaUplate
            key={pregled.placanje.id}
            placanje={pregled.placanje}
            tipRacuna="ulazni"
            predlogRedovi={pregled.predlogRedovi}
            onChanged={load}
          />
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state">Učitavanje...</div>
        ) : placanja.length === 0 ? (
          <div className="empty-state">Nema unetih isplata.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Dobavljač</th>
                  <th>Iznos</th>
                  <th>Raspoređeno</th>
                  <th>Neraspoređeno</th>
                  <th className="col-sticky-right"></th>
                </tr>
              </thead>
              <tbody>
                {placanja.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Datum" className="mono">{new Date(p.datum).toLocaleDateString("sr-RS")}</td>
                    <td data-label="Dobavljač">{p.partneri?.naziv || "—"}</td>
                    <td data-label="Iznos" className="mono">{formatIznos(p.iznos, p.valuta)}</td>
                    <td data-label="Raspoređeno" className="mono">{formatIznos(p.rasporedjeno, p.valuta)}</td>
                    <td data-label="Neraspoređeno">
                      {Number(p.neraspodeljeno) > 0 ? (
                        <span className="pill warn">{formatIznos(p.neraspodeljeno, p.valuta)}</span>
                      ) : (
                        <span className="pill ok">0</span>
                      )}
                    </td>
                    <td data-label="" className="cell-block col-sticky-right">
                      <button className="btn secondary" onClick={() => setPregled({ placanje: p, predlogRedovi: [], upozorenja: [] })}>
                        Raspodeli
                      </button>
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
