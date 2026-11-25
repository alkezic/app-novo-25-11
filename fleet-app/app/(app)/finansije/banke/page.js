"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { zabeleziIzmenu } from "@/lib/log";

const PRAZAN = { naziv: "", banka: "", broj_racuna: "", valuta: "RSD", napomena: "" };

export default function BankePage() {
  const supabase = createClient();
  const [banke, setBanke] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(PRAZAN);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("banke_racuni").select("*").order("naziv", { ascending: true });
    setBanke(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { error } = await supabase.from("banke_racuni").insert(form);
    setSaving(false);

    if (error) {
      setError("Greška pri čuvanju: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, { opis: `Dodat bankovni račun ${form.naziv}`, tabela: "banke_racuni", akcija: "dodavanje" });

    setForm(PRAZAN);
    setShowForm(false);
    load();
  }

  async function handleDelete(b) {
    if (!confirm(`Obrisati bankovni račun "${b.naziv}"?`)) return;
    await supabase.from("banke_racuni").delete().eq("id", b.id);
    await zabeleziIzmenu(supabase, { opis: `Obrisan bankovni račun ${b.naziv}`, tabela: "banke_racuni", akcija: "brisanje" });
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Banke</h1>
          <p className="page-subtitle">Naši bankovni računi — koriste se prilikom evidentiranja uplata i isplata.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Otkaži" : "+ Novi račun"}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="form-grid">
            <div className="form-field">
              <label>Naziv (interni)</label>
              <input required value={form.naziv} onChange={(e) => setForm({ ...form, naziv: e.target.value })} placeholder="npr. Raiffeisen tekući" />
            </div>
            <div className="form-field">
              <label>Banka</label>
              <input value={form.banka} onChange={(e) => setForm({ ...form, banka: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Broj računa (IBAN)</label>
              <input value={form.broj_racuna} onChange={(e) => setForm({ ...form, broj_racuna: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Valuta</label>
              <select value={form.valuta} onChange={(e) => setForm({ ...form, valuta: e.target.value })}>
                <option value="RSD">RSD</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label>Napomena</label>
            <textarea rows={2} value={form.napomena} onChange={(e) => setForm({ ...form, napomena: e.target.value })} />
          </div>
          {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Čuvanje..." : "Sačuvaj"}
          </button>
        </form>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state">Učitavanje...</div>
        ) : banke.length === 0 ? (
          <div className="empty-state">Nema unetih bankovnih računa.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Naziv</th>
                  <th>Banka</th>
                  <th>Broj računa</th>
                  <th>Valuta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {banke.map((b) => (
                  <tr key={b.id}>
                    <td data-label="Naziv" className="cell-strong">{b.naziv}</td>
                    <td data-label="Banka">{b.banka || "—"}</td>
                    <td data-label="Broj računa" className="mono">{b.broj_racuna || "—"}</td>
                    <td data-label="Valuta">{b.valuta}</td>
                    <td data-label="" className="cell-block">
                      <button className="btn secondary" onClick={() => handleDelete(b)}>Obriši</button>
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
