"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StatusPill, { rokStatus } from "@/components/StatusPill";

const PRAZAN = {
  tip: "ulazni",
  broj_racuna: "",
  partner_id: "",
  vozilo_id: "",
  iznos: "",
  valuta: "RSD",
  datum_izdavanja: "",
  rok_placanja: "",
  status: "neplaceno",
  opis: "",
};

export default function RacuniPage() {
  const supabase = createClient();
  const [racuni, setRacuni] = useState([]);
  const [partneri, setPartneri] = useState([]);
  const [vozila, setVozila] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(PRAZAN);
  const [noviPartner, setNoviPartner] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("svi");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: r }, { data: p }, { data: v }] = await Promise.all([
      supabase.from("racuni").select("*, partneri(naziv), vozila(marka_tip, registracija)").order("rok_placanja", { ascending: true }),
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      partner_id: form.partner_id || null,
      vozilo_id: form.vozilo_id || null,
      iznos: Number(form.iznos),
      rok_placanja: form.rok_placanja || null,
    };

    const { error } = await supabase.from("racuni").insert(payload);
    setSaving(false);

    if (error) {
      setError("Greška pri čuvanju: " + error.message);
      return;
    }

    setForm(PRAZAN);
    setShowForm(false);
    load();
  }

  async function handleStatusChange(id, status) {
    await supabase.from("racuni").update({ status }).eq("id", id);
    load();
  }

  async function handleDelete(id) {
    if (!confirm("Obrisati ovaj račun? Vezana plaćanja će takođe biti obrisana.")) return;
    await supabase.from("racuni").delete().eq("id", id);
    load();
  }

  const prikazani = racuni.filter((r) => filter === "svi" || r.tip === filter);

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Računi</h1>
          <p className="page-subtitle">Izdati (izlazni) i primljeni (ulazni) računi.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Otkaži" : "+ Novi račun"}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="form-grid">
            <div className="form-field">
              <label>Tip</label>
              <select value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })}>
                <option value="ulazni">Ulazni (mi plaćamo)</option>
                <option value="izlazni">Izlazni (nama plaćaju)</option>
              </select>
            </div>
            <div className="form-field">
              <label>Broj računa</label>
              <input value={form.broj_racuna} onChange={(e) => setForm({ ...form, broj_racuna: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Partner</label>
              <select value={form.partner_id} onChange={(e) => setForm({ ...form, partner_id: e.target.value })}>
                <option value="">— izaberi partnera —</option>
                {partneri.map((p) => <option key={p.id} value={p.id}>{p.naziv}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input placeholder="Novi partner..." value={noviPartner} onChange={(e) => setNoviPartner(e.target.value)} style={{ flex: 1 }} />
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
            <div className="form-field">
              <label>Datum izdavanja</label>
              <input type="date" required value={form.datum_izdavanja} onChange={(e) => setForm({ ...form, datum_izdavanja: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Rok plaćanja</label>
              <input type="date" value={form.rok_placanja} onChange={(e) => setForm({ ...form, rok_placanja: e.target.value })} />
            </div>
          </div>
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label>Opis</label>
            <textarea rows={2} value={form.opis} onChange={(e) => setForm({ ...form, opis: e.target.value })} />
          </div>
          {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Čuvanje..." : "Sačuvaj račun"}
          </button>
        </form>
      )}

      <div className="toolbar">
        <div style={{ display: "flex", gap: 8 }}>
          {["svi", "ulazni", "izlazni"].map((f) => (
            <button key={f} className={`btn secondary`} style={filter === f ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}} onClick={() => setFilter(f)}>
              {f === "svi" ? "Svi" : f === "ulazni" ? "Ulazni" : "Izlazni"}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Učitavanje...</div>
        ) : prikazani.length === 0 ? (
          <div className="empty-state">Nema računa za prikaz.</div>
        ) : (
          <div className="table-scroll">
<table>
            <thead>
              <tr>
                <th>Tip</th>
                <th>Partner</th>
                <th>Iznos</th>
                <th>Rok</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prikazani.map((r) => {
                const s = rokStatus(r.rok_placanja);
                return (
                  <tr key={r.id}>
                    <td>{r.tip === "izlazni" ? "Izlazni" : "Ulazni"}</td>
                    <td>{r.partneri?.naziv || "—"}</td>
                    <td className="mono">{Number(r.iznos).toLocaleString("sr-RS")} {r.valuta}</td>
                    <td className="mono">
                      {r.rok_placanja ? new Date(r.rok_placanja).toLocaleDateString("sr-RS") : "—"}
                      {r.status !== "placeno" && r.rok_placanja && (
                        <div><StatusPill label={s.label} tone={s.tone === "ok" ? "warn" : s.tone} /></div>
                      )}
                    </td>
                    <td>
                      <select value={r.status} onChange={(e) => handleStatusChange(r.id, e.target.value)}>
                        <option value="neplaceno">Neplaćeno</option>
                        <option value="delimicno">Delimično</option>
                        <option value="placeno">Plaćeno</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn secondary" onClick={() => handleDelete(r.id)}>Obriši</button>
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
