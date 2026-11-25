"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PODRAZUMEVANA_PODESAVANJA, ucitajPodesavanja } from "@/lib/podesavanja";
import { zabeleziIzmenu } from "@/lib/log";
import { useToast } from "@/components/Toast";

const POLJA_VOZILA = [
  { key: "marka_tip", label: "Marka i tip" },
  { key: "vrsta_vozila", label: "Vrsta vozila" },
  { key: "broj_sedista", label: "Broj sedišta" },
  { key: "vozac", label: "Vozač" },
  { key: "vlasnistvo", label: "Vlasništvo" },
  { key: "aktivno", label: "Aktivno" },
  { key: "u_voznom_parku", label: "U voznom parku" },
  { key: "istek_registracije", label: "Istek registracije" },
];

const POLJA_VOZACI = [
  { key: "telefon", label: "Telefon" },
  { key: "email", label: "Email" },
  { key: "broj_vozacke", label: "Broj vozačke" },
  { key: "kategorija", label: "Kategorija" },
  { key: "aktivan", label: "Aktivan" },
];

const DELOVI_PREGLEDA = [
  { key: "stat_vozila", label: "Kartica: broj vozila" },
  { key: "stat_dokumenta", label: "Kartica: dokumenta koja ističu" },
  { key: "stat_servis", label: "Kartica: blizu servisa" },
  { key: "stat_sestomesecni", label: "Kartica: bez šestomesečnog pregleda" },
  { key: "sekcija_dokumenta", label: "Tabela: dokumenta koja ističu" },
  { key: "sekcija_servis", label: "Tabela: vozila blizu servisa" },
  { key: "sekcija_sastav", label: "Sastav flote (po vrsti, statusu...)" },
  { key: "sekcija_sestomesecni", label: "Tabela: bez šestomesečnog pregleda" },
];

export default function PodesavanjaPage() {
  const supabase = createClient();
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState(PODRAZUMEVANA_PODESAVANJA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const podesavanja = await ucitajPodesavanja(supabase);
    setForm(podesavanja);
    setLoading(false);
  }

  function postaviPolje(grupa, kljuc, vrednost) {
    setForm((f) => ({ ...f, [grupa]: { ...f[grupa], [kljuc]: vrednost } }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      id: "default",
      naziv_firme: form.naziv_firme || "Vozni park",
      akcenat_tamno: form.akcenat_tamno,
      akcenat_svetlo: form.akcenat_svetlo,
      prag_servis_km: Number(form.prag_servis_km) || 2000,
      prag_rokovi_dana: Number(form.prag_rokovi_dana) || 14,
      prikaz_vozila: form.prikaz_vozila,
      prikaz_vozaci: form.prikaz_vozaci,
      prikaz_pregled: form.prikaz_pregled,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("podesavanja").upsert(payload);
    setSaving(false);

    if (error) {
      setError("Greška pri čuvanju: " + error.message);
      toast.error("Greška pri čuvanju podešavanja: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: "Izmenjena podešavanja aplikacije",
      tabela: "podesavanja",
      akcija: "izmena",
    });

    toast.success("Podešavanja su sačuvana");
    router.refresh();
  }

  async function handleReset() {
    if (!confirm("Vratiti sva podešavanja na podrazumevane vrednosti?")) return;
    setForm(PODRAZUMEVANA_PODESAVANJA);
    toast.info("Podešavanja su vraćena na podrazumevane vrednosti (nije sačuvano)");
  }

  if (loading) return <div className="page-subtitle">Učitavanje...</div>;

  return (
    <div>
      <h1 className="page-title">Podešavanja</h1>
      <p className="page-subtitle">Boje interfejsa, prikazana polja i pragovi za upozorenja. Zajedničko za sve korisnike.</p>

      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: 20 }}>
          <strong>Opšte</strong>
          <div className="form-grid" style={{ marginTop: 14 }}>
            <div className="form-field">
              <label>Naziv firme (prikazuje se u meniju)</label>
              <input value={form.naziv_firme} onChange={(e) => setForm({ ...form, naziv_firme: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Prag za "blizu servisa" (km)</label>
              <input type="number" value={form.prag_servis_km} onChange={(e) => setForm({ ...form, prag_servis_km: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Prag za rokove dokumenata (broj dana unapred)</label>
              <input type="number" value={form.prag_rokovi_dana} onChange={(e) => setForm({ ...form, prag_rokovi_dana: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <strong>Boje</strong>
          <p className="page-subtitle" style={{ marginTop: 4, marginBottom: 14 }}>
            Bira se jedna glavna boja po temi — ostale nijanse (tekst, senke) se automatski računaju da ostanu čitljive.
          </p>
          <div className="form-grid">
            <div className="form-field">
              <label>Akcenat — tamna tema</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={form.akcenat_tamno}
                  onChange={(e) => setForm({ ...form, akcenat_tamno: e.target.value })}
                  style={{ width: 44, height: 38, padding: 2, cursor: "pointer" }}
                />
                <input
                  value={form.akcenat_tamno}
                  onChange={(e) => setForm({ ...form, akcenat_tamno: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className="form-field">
              <label>Akcenat — svetla tema</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={form.akcenat_svetlo}
                  onChange={(e) => setForm({ ...form, akcenat_svetlo: e.target.value })}
                  style={{ width: 44, height: 38, padding: 2, cursor: "pointer" }}
                />
                <input
                  value={form.akcenat_svetlo}
                  onChange={(e) => setForm({ ...form, akcenat_svetlo: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <strong>Vozila — prikazana polja u tabeli</strong>
          <p className="page-subtitle" style={{ marginTop: 4, marginBottom: 14 }}>
            Registracija i Dokumenta se uvek prikazuju.
          </p>
          <div className="settings-checkbox-grid">
            {POLJA_VOZILA.map((p) => (
              <label key={p.key} className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={!!form.prikaz_vozila[p.key]}
                  onChange={(e) => postaviPolje("prikaz_vozila", p.key, e.target.checked)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <strong>Vozači — prikazana polja u tabeli</strong>
          <p className="page-subtitle" style={{ marginTop: 4, marginBottom: 14 }}>
            Ime i prezime i Dokumenta se uvek prikazuju.
          </p>
          <div className="settings-checkbox-grid">
            {POLJA_VOZACI.map((p) => (
              <label key={p.key} className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={!!form.prikaz_vozaci[p.key]}
                  onChange={(e) => postaviPolje("prikaz_vozaci", p.key, e.target.checked)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <strong>Pregled — prikazani delovi</strong>
          <div className="settings-checkbox-grid" style={{ marginTop: 14 }}>
            {DELOVI_PREGLEDA.map((p) => (
              <label key={p.key} className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={!!form.prikaz_pregled[p.key]}
                  onChange={(e) => postaviPolje("prikaz_pregled", p.key, e.target.checked)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Čuvanje..." : "Sačuvaj podešavanja"}
          </button>
          <button className="btn secondary" type="button" onClick={handleReset}>
            Vrati na podrazumevano
          </button>
        </div>
      </form>
    </div>
  );
}