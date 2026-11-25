"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { zabeleziIzmenu } from "@/lib/log";
import { formatIznos, statusRacuna } from "@/lib/finansije";

const PRAZAN = {
  broj_racuna: "",
  partner_id: "",
  vozilo_id: "",
  iznos: "",
  valuta: "RSD",
  kurs: "1",
  pdv_stopa: "",
  datum_izdavanja: new Date().toISOString().slice(0, 10),
  datum_valute: "",
  opis: "",
};

export default function IzdatiRacuniPage() {
  const supabase = createClient();
  const [racuni, setRacuni] = useState([]);
  const [partneri, setPartneri] = useState([]);
  const [vozila, setVozila] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(PRAZAN);
  const [noviPartner, setNoviPartner] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("sve");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: r }, { data: p }, { data: v }] = await Promise.all([
      supabase.from("v_racuni_stanje").select("*, partneri(naziv)").eq("tip", "izlazni").order("datum_izdavanja", { ascending: false }),
      supabase.from("partneri").select("id, naziv").order("naziv"),
      supabase.from("vozila").select("id, marka_tip, registracija"),
    ]);
    setRacuni(r || []);
    setPartneri(p || []);
    setVozila(v || []);
    setLoading(false);
  }

  async function handleDodajPartnera() {
    if (!noviPartner.trim()) return;
    const { data, error } = await supabase.from("partneri").insert({ naziv: noviPartner.trim() }).select().single();
    if (!error && data) {
      setPartneri((prev) => [...prev, data].sort((a, b) => a.naziv.localeCompare(b.naziv)));
      setForm((f) => ({ ...f, partner_id: data.id }));
      setNoviPartner("");
    }
  }

  async function handlePredlogBroja() {
    const { data, error } = await supabase.rpc("sledeci_broj_izlaznog_racuna");
    if (!error && data) setForm((f) => ({ ...f, broj_racuna: data }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    let fajl_url = null;
    if (file) {
      const putanja = `finansije/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("dokumenti").upload(putanja, file);
      if (uploadError) {
        setError("Greška pri otpremanju fajla: " + uploadError.message);
        setSaving(false);
        return;
      }
      fajl_url = putanja;
    }

    const payload = {
      tip: "izlazni",
      broj_racuna: form.broj_racuna || null,
      partner_id: form.partner_id || null,
      vozilo_id: form.vozilo_id || null,
      iznos: Number(form.iznos),
      valuta: form.valuta,
      kurs: Number(form.kurs) || 1,
      pdv_stopa: form.pdv_stopa ? Number(form.pdv_stopa) : null,
      datum_izdavanja: form.datum_izdavanja,
      datum_valute: form.datum_valute || null,
      opis: form.opis || null,
      fajl_url,
    };

    const { error } = await supabase.from("racuni").insert(payload);
    setSaving(false);

    if (error) {
      setError("Greška pri čuvanju: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: `Izdat račun ${form.broj_racuna || ""} (${formatIznos(form.iznos, form.valuta)})`,
      tabela: "racuni",
      akcija: "dodavanje",
    });

    setForm(PRAZAN);
    setFile(null);
    setShowForm(false);
    load();
  }

  const prikazani = filterStatus === "sve" ? racuni : racuni.filter((r) => r.status === filterStatus);

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Izdati računi</h1>
          <p className="page-subtitle">Računi koje mi izdajemo klijentima.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Otkaži" : "+ Novi račun"}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="form-grid">
            <div className="form-field">
              <label>Broj računa</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={form.broj_racuna} onChange={(e) => setForm({ ...form, broj_racuna: e.target.value })} style={{ flex: 1 }} />
                <button type="button" className="btn secondary" onClick={handlePredlogBroja}>Predloži</button>
              </div>
            </div>
            <div className="form-field">
              <label>Klijent</label>
              <select value={form.partner_id} onChange={(e) => setForm({ ...form, partner_id: e.target.value })}>
                <option value="">— izaberi klijenta —</option>
                {partneri.map((p) => <option key={p.id} value={p.id}>{p.naziv}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input placeholder="Novi klijent..." value={noviPartner} onChange={(e) => setNoviPartner(e.target.value)} style={{ flex: 1 }} />
                <button type="button" className="btn secondary" onClick={handleDodajPartnera}>Dodaj</button>
              </div>
            </div>
            <div className="form-field">
              <label>Vozilo (opciono)</label>
              <select value={form.vozilo_id} onChange={(e) => setForm({ ...form, vozilo_id: e.target.value })}>
                <option value="">— bez vozila —</option>
                {vozila.map((v) => <option key={v.id} value={v.id}>{v.marka_tip} · {v.registracija}</option>)}
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
            {form.valuta !== "RSD" && (
              <div className="form-field">
                <label>Kurs (u odnosu na RSD)</label>
                <input type="number" step="0.0001" value={form.kurs} onChange={(e) => setForm({ ...form, kurs: e.target.value })} />
              </div>
            )}
            <div className="form-field">
              <label>PDV stopa % (opciono)</label>
              <input type="number" step="0.01" value={form.pdv_stopa} onChange={(e) => setForm({ ...form, pdv_stopa: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Datum računa</label>
              <input type="date" required value={form.datum_izdavanja} onChange={(e) => setForm({ ...form, datum_izdavanja: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Valuta plaćanja (rok)</label>
              <input type="date" value={form.datum_valute} onChange={(e) => setForm({ ...form, datum_valute: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Fajl računa (PDF)</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label>Opis / stavke</label>
            <textarea rows={2} value={form.opis} onChange={(e) => setForm({ ...form, opis: e.target.value })} />
          </div>
          {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Čuvanje..." : "Sačuvaj račun"}
          </button>
        </form>
      )}

      <div className="kategorija-row">
        {["sve", "neplaceno", "delimicno", "placeno"].map((s) => (
          <button key={s} className={`kategorija-btn ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)}>
            {s === "sve" ? "Sve" : statusRacuna(s).label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Učitavanje...</div>
        ) : prikazani.length === 0 ? (
          <div className="empty-state">Nema izdatih računa za prikaz.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Broj računa</th>
                  <th>Klijent</th>
                  <th>Datum</th>
                  <th>Valuta plaćanja</th>
                  <th>Iznos</th>
                  <th>Plaćeno</th>
                  <th>Preostalo</th>
                  <th>Status</th>
                  <th className="col-sticky-right"></th>
                </tr>
              </thead>
              <tbody>
                {prikazani.map((r) => {
                  const s = statusRacuna(r.status);
                  return (
                    <tr key={r.id}>
                      <td data-label="Broj računa" className="mono cell-strong">{r.broj_racuna || "—"}</td>
                      <td data-label="Klijent">{r.partneri?.naziv || "—"}</td>
                      <td data-label="Datum" className="mono">{new Date(r.datum_izdavanja).toLocaleDateString("sr-RS")}</td>
                      <td data-label="Valuta plaćanja" className="mono">{r.datum_valute ? new Date(r.datum_valute).toLocaleDateString("sr-RS") : "—"}</td>
                      <td data-label="Iznos" className="mono">{formatIznos(r.iznos, r.valuta)}</td>
                      <td data-label="Plaćeno" className="mono">{formatIznos(r.placeno, r.valuta)}</td>
                      <td data-label="Preostalo" className="mono">{formatIznos(r.preostalo, r.valuta)}</td>
                      <td data-label="Status"><span className={`pill ${s.tone}`}>{s.label}</span></td>
                      <td data-label="" className="cell-block col-sticky-right">
                        <Link href={`/finansije/racuni/${r.id}`} className="btn secondary">Detalji</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
