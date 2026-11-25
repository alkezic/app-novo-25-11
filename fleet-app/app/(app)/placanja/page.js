"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PRAZAN = { racun_id: "", iznos: "", datum: "", nacin: "racun", napomena: "" };

export default function PlacanjaPage() {
  const supabase = createClient();
  const [placanja, setPlacanja] = useState([]);
  const [racuni, setRacuni] = useState([]);
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
    const [{ data: pl }, { data: r }] = await Promise.all([
      supabase.from("placanja").select("*, racuni(broj_racuna, tip, partneri(naziv))").order("datum", { ascending: false }),
      supabase.from("racuni").select("id, broj_racuna, tip, iznos, partneri(naziv)").order("datum_izdavanja", { ascending: false }),
    ]);
    setPlacanja(pl || []);
    setRacuni(r || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = { ...form, iznos: Number(form.iznos) };
    const { error } = await supabase.from("placanja").insert(payload);
    setSaving(false);

    if (error) {
      setError("Greška pri čuvanju: " + error.message);
      return;
    }

    setForm(PRAZAN);
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    if (!confirm("Obrisati ovo plaćanje?")) return;
    await supabase.from("placanja").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Plaćanja</h1>
          <p className="page-subtitle">Uplate i isplate vezane za pojedinačne račune.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Otkaži" : "+ Novo plaćanje"}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="form-grid">
            <div className="form-field">
              <label>Račun</label>
              <select required value={form.racun_id} onChange={(e) => setForm({ ...form, racun_id: e.target.value })}>
                <option value="">— izaberi račun —</option>
                {racuni.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.tip === "izlazni" ? "Izlazni" : "Ulazni"} · {r.broj_racuna || "bez broja"} · {r.partneri?.naziv || "—"} · {Number(r.iznos).toLocaleString("sr-RS")}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Iznos</label>
              <input type="number" step="0.01" required value={form.iznos} onChange={(e) => setForm({ ...form, iznos: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Datum</label>
              <input type="date" required value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Način plaćanja</label>
              <select value={form.nacin} onChange={(e) => setForm({ ...form, nacin: e.target.value })}>
                <option value="racun">Račun (bankovni transfer)</option>
                <option value="gotovina">Gotovina</option>
                <option value="kartica">Kartica</option>
                <option value="ostalo">Ostalo</option>
              </select>
            </div>
          </div>
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label>Napomena</label>
            <textarea rows={2} value={form.napomena} onChange={(e) => setForm({ ...form, napomena: e.target.value })} />
          </div>
          {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Čuvanje..." : "Sačuvaj plaćanje"}
          </button>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-soft)" }}>
            Napomena: ovo beleži uplatu, ali ne menja automatski status računa — status ručno ažuriraš na stranici Računi.
          </div>
        </form>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state">Učitavanje...</div>
        ) : placanja.length === 0 ? (
          <div className="empty-state">Nema unetih plaćanja.</div>
        ) : (
          <div className="table-scroll">
<table>
            <thead>
              <tr>
                <th>Račun</th>
                <th>Partner</th>
                <th>Iznos</th>
                <th>Datum</th>
                <th>Način</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {placanja.map((p) => (
                <tr key={p.id}>
                  <td>{p.racuni?.broj_racuna || "bez broja"} ({p.racuni?.tip === "izlazni" ? "izlazni" : "ulazni"})</td>
                  <td>{p.racuni?.partneri?.naziv || "—"}</td>
                  <td className="mono">{Number(p.iznos).toLocaleString("sr-RS")}</td>
                  <td className="mono">{new Date(p.datum).toLocaleDateString("sr-RS")}</td>
                  <td>{p.nacin}</td>
                  <td>
                    <button className="btn secondary" onClick={() => handleDelete(p.id)}>Obriši</button>
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
