"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { zabeleziIzmenu } from "@/lib/log";
import { nazivTipaDokumenta } from "@/lib/tipDokumenta";
import { formatDatum } from "@/lib/datum";
import ReplaceFileButton from "@/components/ReplaceFileButton";
import { useToast } from "@/components/Toast";
import Skeleton from "@/components/Skeleton";

const PRAZAN_EDIT = {
  registracija: "",
  marka_tip: "",
  godina: "",
  vin: "",
  broj_sedista: "",
  vrsta_vozila: "",
  aktivno: true,
  u_voznom_parku: "",
  vlasnistvo: "sopstveno",
  lizing_br_ugovora: "",
  vozac: "",
  vozac_id: "",
  istek_registracije: "",
  napomena: "",
};

const PRAZAN_VOZAC = {
  ime_prezime: "",
  telefon: "",
  email: "",
  broj_vozacke: "",
  kategorija: "",
  aktivan: true,
  napomena: "",
};

const TABOVI = [
  { key: "vozila", label: "Vozila" },
  { key: "vozaci", label: "Vozači" },
  { key: "dokumenti", label: "Dokumenti" },
  { key: "log", label: "Istorija izmena" },
];

export default function AdministracijaPage() {
  const supabase = createClient();
  const toast = useToast();
  const [tab, setTab] = useState("vozila");

  const [vozila, setVozila] = useState([]);
  const [vozaci, setVozaci] = useState([]);
  const [dokumenta, setDokumenta] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(PRAZAN_EDIT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState(PRAZAN_EDIT);
  const [savingNew, setSavingNew] = useState(false);
  const [newError, setNewError] = useState("");

  const [editingVozacId, setEditingVozacId] = useState(null);
  const [editVozacForm, setEditVozacForm] = useState(PRAZAN_VOZAC);
  const [savingVozac, setSavingVozac] = useState(false);
  const [vozacError, setVozacError] = useState("");

  const [showNewVozacForm, setShowNewVozacForm] = useState(false);
  const [newVozacForm, setNewVozacForm] = useState(PRAZAN_VOZAC);
  const [savingNewVozac, setSavingNewVozac] = useState(false);
  const [newVozacError, setNewVozacError] = useState("");

  const [pretraga, setPretraga] = useState("");
  const [logPretraga, setLogPretraga] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: v }, { data: vc }, { data: d }, { data: l }] = await Promise.all([
      supabase.from("vozila").select("*").order("registracija", { ascending: true }),
      supabase.from("vozaci").select("*").order("ime_prezime", { ascending: true }),
      supabase.from("dokumenta").select("*, vozila(marka_tip, registracija), vozaci(ime_prezime)").order("created_at", { ascending: false }),
      supabase.from("log_izmena").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setVozila(v || []);
    setVozaci(vc || []);
    setDokumenta(d || []);
    setLog(l || []);
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSavingNew(true);
    setNewError("");

    const payload = {
      ...newForm,
      godina: newForm.godina ? Number(newForm.godina) : null,
      broj_sedista: newForm.broj_sedista ? Number(newForm.broj_sedista) : null,
      u_voznom_parku: newForm.u_voznom_parku || null,
      vozac_id: newForm.vozac_id || null,
      istek_registracije: newForm.istek_registracije || null,
    };

    const { error } = await supabase.from("vozila").insert(payload);
    setSavingNew(false);

    if (error) {
      setNewError("Greška pri čuvanju: " + error.message);
      toast.error("Greška pri čuvanju vozila: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: `Dodato vozilo ${newForm.registracija} (${newForm.marka_tip})`,
      tabela: "vozila",
      akcija: "dodavanje",
    });

    toast.success(`Vozilo ${newForm.registracija} je dodato`);
    setNewForm(PRAZAN_EDIT);
    setShowNewForm(false);
    load();
  }

  function startEdit(v) {
    setEditingId(v.id);
    setError("");
    setEditForm({
      registracija: v.registracija || "",
      marka_tip: v.marka_tip || "",
      godina: v.godina ?? "",
      vin: v.vin || "",
      broj_sedista: v.broj_sedista ?? "",
      vrsta_vozila: v.vrsta_vozila || "",
      aktivno: v.aktivno,
      u_voznom_parku: v.u_voznom_parku || "",
      vlasnistvo: v.vlasnistvo || "sopstveno",
      lizing_br_ugovora: v.lizing_br_ugovora || "",
      vozac: v.vozac || "",
      vozac_id: v.vozac_id || "",
      istek_registracije: v.istek_registracije || "",
      napomena: v.napomena || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  async function handleSave(id) {
    setSaving(true);
    setError("");

    const payload = {
      ...editForm,
      godina: editForm.godina ? Number(editForm.godina) : null,
      broj_sedista: editForm.broj_sedista ? Number(editForm.broj_sedista) : null,
      u_voznom_parku: editForm.u_voznom_parku || null,
      vozac_id: editForm.vozac_id || null,
      istek_registracije: editForm.istek_registracije || null,
    };

    const { error } = await supabase.from("vozila").update(payload).eq("id", id);
    setSaving(false);

    if (error) {
      setError("Greška pri čuvanju: " + error.message);
      toast.error("Greška pri čuvanju izmena: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: `Izmenjeno vozilo ${editForm.registracija} (${editForm.marka_tip})`,
      tabela: "vozila",
      akcija: "izmena",
    });

    toast.success(`Izmene za ${editForm.registracija} su sačuvane`);
    setEditingId(null);
    load();
  }

  async function handleDelete(v) {
    if (!confirm(`Obrisati vozilo ${v.registracija}? Vezana dokumenta, putarine i istorija se takođe brišu. Ova radnja je trajna.`)) return;
    await supabase.from("vozila").delete().eq("id", v.id);
    await zabeleziIzmenu(supabase, {
      opis: `Obrisano vozilo ${v.registracija} (${v.marka_tip})`,
      tabela: "vozila",
      akcija: "brisanje",
    });
    toast.info(`Vozilo ${v.registracija} je obrisano`);
    load();
  }

  async function handleOpenFile(fajl_url) {
    const { data } = await supabase.storage.from("dokumenti").createSignedUrl(fajl_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Fajl nije moguće otvoriti");
  }

  async function handleDeleteDoc(d) {
    if (!confirm("Obrisati ovaj dokument?")) return;
    await supabase.from("dokumenta").delete().eq("id", d.id);
    await zabeleziIzmenu(supabase, {
      opis: `Obrisan dokument (${nazivTipaDokumenta(d.tip)})${d.vozila ? " za vozilo " + d.vozila.registracija : ""}${d.vozaci ? " za vozača " + d.vozaci.ime_prezime : ""}`,
      tabela: "dokumenta",
      akcija: "brisanje",
    });
    toast.info("Dokument je obrisan");
    load();
  }

  async function handleCreateVozac(e) {
    e.preventDefault();
    setSavingNewVozac(true);
    setNewVozacError("");

    const { error } = await supabase.from("vozaci").insert(newVozacForm);
    setSavingNewVozac(false);

    if (error) {
      setNewVozacError("Greška pri čuvanju: " + error.message);
      toast.error("Greška pri čuvanju vozača: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: `Dodat vozač ${newVozacForm.ime_prezime}`,
      tabela: "vozaci",
      akcija: "dodavanje",
    });

    toast.success(`Vozač ${newVozacForm.ime_prezime} je dodat`);
    setNewVozacForm(PRAZAN_VOZAC);
    setShowNewVozacForm(false);
    load();
  }

  function startEditVozac(v) {
    setEditingVozacId(v.id);
    setVozacError("");
    setEditVozacForm({
      ime_prezime: v.ime_prezime || "",
      telefon: v.telefon || "",
      email: v.email || "",
      broj_vozacke: v.broj_vozacke || "",
      kategorija: v.kategorija || "",
      aktivan: v.aktivan,
      napomena: v.napomena || "",
    });
  }

  function cancelEditVozac() {
    setEditingVozacId(null);
    setVozacError("");
  }

  async function handleSaveVozac(id) {
    setSavingVozac(true);
    setVozacError("");

    const { error } = await supabase.from("vozaci").update(editVozacForm).eq("id", id);
    setSavingVozac(false);

    if (error) {
      setVozacError("Greška pri čuvanju: " + error.message);
      toast.error("Greška pri čuvanju vozača: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: `Izmenjen vozač ${editVozacForm.ime_prezime}`,
      tabela: "vozaci",
      akcija: "izmena",
    });

    toast.success(`Izmene za ${editVozacForm.ime_prezime} su sačuvane`);
    setEditingVozacId(null);
    load();
  }

  async function handleDeleteVozac(v) {
    if (!confirm(`Obrisati vozača ${v.ime_prezime}? Vezana dokumenta se takođe brišu, a vozila mu se automatski uklanjaju kao dodeljena.`)) return;
    await supabase.from("vozaci").delete().eq("id", v.id);
    await zabeleziIzmenu(supabase, {
      opis: `Obrisan vozač ${v.ime_prezime}`,
      tabela: "vozaci",
      akcija: "brisanje",
    });
    toast.info(`Vozač ${v.ime_prezime} je obrisan`);
    load();
  }

  const q = pretraga.trim().toLowerCase();

  const vozilaFiltrirana = useMemo(() => {
    if (!q) return vozila;
    return vozila.filter((v) =>
      [v.registracija, v.marka_tip, v.vin, v.vozac, v.napomena]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(q))
    );
  }, [vozila, q]);

  const vozaciFiltrirani = useMemo(() => {
    if (!q) return vozaci;
    return vozaci.filter((v) =>
      [v.ime_prezime, v.telefon, v.email, v.broj_vozacke, v.napomena]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(q))
    );
  }, [vozaci, q]);

  const grupeVozila = useMemo(() => {
    const mapa = new Map();
    dokumenta
      .filter((d) => d.vozilo_id)
      .forEach((d) => {
        if (!mapa.has(d.vozilo_id)) mapa.set(d.vozilo_id, { kljuc: d.vozilo_id, vlasnik: d.vozila, dokumenti: [] });
        mapa.get(d.vozilo_id).dokumenti.push(d);
      });
    let grupe = Array.from(mapa.values());
    grupe.sort((a, b) => (a.vlasnik?.registracija || "").localeCompare(b.vlasnik?.registracija || ""));

    if (!q) return grupe;
    return grupe
      .map((g) => {
        const vlasnikOdgovara = [g.vlasnik?.registracija, g.vlasnik?.marka_tip].filter(Boolean).some((v) => v.toLowerCase().includes(q));
        if (vlasnikOdgovara) return g;
        const dokFiltrirani = g.dokumenti.filter((d) =>
          [nazivTipaDokumenta(d.tip), d.broj, d.izdavalac].filter(Boolean).some((v) => v.toLowerCase().includes(q))
        );
        return dokFiltrirani.length ? { ...g, dokumenti: dokFiltrirani } : null;
      })
      .filter(Boolean);
  }, [dokumenta, q]);

  const grupeVozaca = useMemo(() => {
    const mapa = new Map();
    dokumenta
      .filter((d) => d.vozac_id)
      .forEach((d) => {
        if (!mapa.has(d.vozac_id)) mapa.set(d.vozac_id, { kljuc: d.vozac_id, vlasnik: d.vozaci, dokumenti: [] });
        mapa.get(d.vozac_id).dokumenti.push(d);
      });
    let grupe = Array.from(mapa.values());
    grupe.sort((a, b) => (a.vlasnik?.ime_prezime || "").localeCompare(b.vlasnik?.ime_prezime || ""));

    if (!q) return grupe;
    return grupe
      .map((g) => {
        const vlasnikOdgovara = (g.vlasnik?.ime_prezime || "").toLowerCase().includes(q);
        if (vlasnikOdgovara) return g;
        const dokFiltrirani = g.dokumenti.filter((d) =>
          [nazivTipaDokumenta(d.tip), d.broj, d.izdavalac].filter(Boolean).some((v) => v.toLowerCase().includes(q))
        );
        return dokFiltrirani.length ? { ...g, dokumenti: dokFiltrirani } : null;
      })
      .filter(Boolean);
  }, [dokumenta, q]);

  const dokumentaBezVlasnika = useMemo(
    () => dokumenta.filter((d) => !d.vozilo_id && !d.vozac_id),
    [dokumenta]
  );

  const logQ = logPretraga.trim().toLowerCase();
  const logFiltriran = useMemo(() => {
    if (!logQ) return log;
    return log.filter((l) =>
      [l.opis, l.korisnik, l.tabela, l.akcija].filter(Boolean).some((v) => v.toLowerCase().includes(logQ))
    );
  }, [log, logQ]);

  function DokumentGrupaTabela({ grupe, naslovKolone }) {
    if (grupe.length === 0) {
      return <div className="empty-state">{q ? "Nema dokumenata koji odgovaraju pretrazi." : "Nema unetih dokumenata."}</div>;
    }
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Tip</th>
              <th>Broj</th>
              <th>Ističe</th>
              <th>Fajl</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {grupe.map((g) => (
              <Fragment key={g.kljuc}>
                <tr className="doc-group-header">
                  <td colSpan={5}>{naslovKolone(g.vlasnik)}</td>
                </tr>
                {g.dokumenti.map((d) => (
                  <tr key={d.id}>
                    <td data-label="Tip">{nazivTipaDokumenta(d.tip)}</td>
                    <td data-label="Broj" className="mono">{d.broj || "—"}</td>
                    <td data-label="Ističe" className="mono">{d.datum_isteka ? formatDatum(d.datum_isteka) : "—"}</td>
                    <td data-label="Fajl" className="cell-block">
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {d.fajl_url && <button className="btn secondary" onClick={() => handleOpenFile(d.fajl_url)}>Otvori</button>}
                        <ReplaceFileButton
                          docId={d.id}
                          oldFajlUrl={d.fajl_url}
                          opisZaLog={`Zamenjen fajl dokumenta (${nazivTipaDokumenta(d.tip)})${d.vozila ? " za vozilo " + d.vozila.registracija : ""}${d.vozaci ? " za vozača " + d.vozaci.ime_prezime : ""}`}
                          onChanged={load}
                        />
                      </div>
                    </td>
                    <td data-label="" className="cell-block">
                      <button className="btn danger" onClick={() => handleDeleteDoc(d)}>Obriši</button>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Administracija</h1>
      <p className="page-subtitle">Dodavanje, izmena i brisanje podataka o vozilima i dokumentima. Ove radnje su trajne — koristi pažljivo.</p>

      <div className="tabs-row">
        {TABOVI.map((t) => (
          <button key={t.key} className={`tab-item ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "log" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <input
            placeholder="Pretraga — vozilo, vozač ili dokument (registracija, ime, broj vozačke, tip dokumenta...)"
            value={pretraga}
            onChange={(e) => setPretraga(e.target.value)}
            style={{ width: "100%" }}
          />
          {q && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-soft)" }}>
              {vozilaFiltrirana.length} vozila · {vozaciFiltrirani.length} vozača · {grupeVozila.reduce((s, g) => s + g.dokumenti.length, 0) + grupeVozaca.reduce((s, g) => s + g.dokumenti.length, 0)} dokumenata odgovara pretrazi
            </div>
          )}
        </div>
      )}

      {tab === "vozila" && (
        <>
          <div className="toolbar">
            <strong>Vozila</strong>
            <button className="btn" onClick={() => setShowNewForm((s) => !s)}>
              {showNewForm ? "Otkaži" : "+ Novo vozilo"}
            </button>
          </div>

          {showNewForm && (
            <form className="card" onSubmit={handleCreate} style={{ marginBottom: 20 }}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Registarska oznaka</label>
                  <input required value={newForm.registracija} onChange={(e) => setNewForm({ ...newForm, registracija: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Marka i tip vozila</label>
                  <input required value={newForm.marka_tip} onChange={(e) => setNewForm({ ...newForm, marka_tip: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Godina proizvodnje</label>
                  <input type="number" value={newForm.godina} onChange={(e) => setNewForm({ ...newForm, godina: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Broj šasije (VIN)</label>
                  <input value={newForm.vin} onChange={(e) => setNewForm({ ...newForm, vin: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Broj sedišta</label>
                  <input type="number" value={newForm.broj_sedista} onChange={(e) => setNewForm({ ...newForm, broj_sedista: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Vrsta vozila</label>
                  <input placeholder="autobus / minibus / kombi..." value={newForm.vrsta_vozila} onChange={(e) => setNewForm({ ...newForm, vrsta_vozila: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Vozač (tekst)</label>
                  <input value={newForm.vozac} onChange={(e) => setNewForm({ ...newForm, vozac: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Formalno dodeljen vozač</label>
                  <select value={newForm.vozac_id} onChange={(e) => setNewForm({ ...newForm, vozac_id: e.target.value })}>
                    <option value="">— nije dodeljeno —</option>
                    {vozaci.map((v) => (
                      <option key={v.id} value={v.id}>{v.ime_prezime}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Vlasništvo</label>
                  <select value={newForm.vlasnistvo} onChange={(e) => setNewForm({ ...newForm, vlasnistvo: e.target.value })}>
                    <option value="sopstveno">Sopstveno</option>
                    <option value="lizing">Lizing</option>
                  </select>
                </div>
                {newForm.vlasnistvo === "lizing" && (
                  <div className="form-field">
                    <label>Broj ugovora o lizingu</label>
                    <input value={newForm.lizing_br_ugovora} onChange={(e) => setNewForm({ ...newForm, lizing_br_ugovora: e.target.value })} />
                  </div>
                )}
                <div className="form-field">
                  <label>Aktivno (u upotrebi)</label>
                  <select value={newForm.aktivno ? "da" : "ne"} onChange={(e) => setNewForm({ ...newForm, aktivno: e.target.value === "da" })}>
                    <option value="da">Da</option>
                    <option value="ne">Ne</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>U voznom parku</label>
                  <input
                    list="status-vozni-park-novo"
                    placeholder="DA / NE..."
                    value={newForm.u_voznom_parku}
                    onChange={(e) => setNewForm({ ...newForm, u_voznom_parku: e.target.value })}
                  />
                  <datalist id="status-vozni-park-novo">
                    <option value="DA" />
                    <option value="NE" />
                  </datalist>
                </div>
                <div className="form-field">
                  <label>Istek registracije</label>
                  <input type="date" value={newForm.istek_registracije} onChange={(e) => setNewForm({ ...newForm, istek_registracije: e.target.value })} />
                </div>
              </div>
              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Napomena</label>
                <textarea rows={2} value={newForm.napomena} onChange={(e) => setNewForm({ ...newForm, napomena: e.target.value })} />
              </div>
              {newError && <div className="error-text" style={{ marginBottom: 12 }}>{newError}</div>}
              <button className="btn" type="submit" disabled={savingNew}>
                {savingNew ? "Čuvanje..." : "Sačuvaj vozilo"}
              </button>
            </form>
          )}

          <div className="card">
            {loading ? (
  <Skeleton.Table rows={6} cols={5} />
) : vozilaFiltrirana.length === 0 ? (
              <div className="empty-state">{q ? "Nema vozila koja odgovaraju pretrazi." : "Nema unetih vozila."}</div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Registracija</th>
                      <th>Marka i tip</th>
                      <th>Vozač</th>
                      <th>Aktivno</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vozilaFiltrirana.map((v) =>
                      editingId === v.id ? (
                        <tr key={v.id}>
                          <td colSpan={5}>
                            <div className="admin-edit-box">
                              <div className="form-grid">
                                <div className="form-field">
                                  <label>Registarska oznaka</label>
                                  <input value={editForm.registracija} onChange={(e) => setEditForm({ ...editForm, registracija: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Marka i tip vozila</label>
                                  <input value={editForm.marka_tip} onChange={(e) => setEditForm({ ...editForm, marka_tip: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Godina proizvodnje</label>
                                  <input type="number" value={editForm.godina} onChange={(e) => setEditForm({ ...editForm, godina: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Broj šasije (VIN)</label>
                                  <input value={editForm.vin} onChange={(e) => setEditForm({ ...editForm, vin: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Broj sedišta</label>
                                  <input type="number" value={editForm.broj_sedista} onChange={(e) => setEditForm({ ...editForm, broj_sedista: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Vrsta vozila</label>
                                  <input value={editForm.vrsta_vozila} onChange={(e) => setEditForm({ ...editForm, vrsta_vozila: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Vozač (tekst)</label>
                                  <input value={editForm.vozac} onChange={(e) => setEditForm({ ...editForm, vozac: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Formalno dodeljen vozač</label>
                                  <select value={editForm.vozac_id} onChange={(e) => setEditForm({ ...editForm, vozac_id: e.target.value })}>
                                    <option value="">— nije dodeljeno —</option>
                                    {vozaci.map((v) => (
                                      <option key={v.id} value={v.id}>{v.ime_prezime}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="form-field">
                                  <label>Vlasništvo</label>
                                  <select value={editForm.vlasnistvo} onChange={(e) => setEditForm({ ...editForm, vlasnistvo: e.target.value })}>
                                    <option value="sopstveno">Sopstveno</option>
                                    <option value="lizing">Lizing</option>
                                  </select>
                                </div>
                                {editForm.vlasnistvo === "lizing" && (
                                  <div className="form-field">
                                    <label>Broj ugovora o lizingu</label>
                                    <input value={editForm.lizing_br_ugovora} onChange={(e) => setEditForm({ ...editForm, lizing_br_ugovora: e.target.value })} />
                                  </div>
                                )}
                                <div className="form-field">
                                  <label>Aktivno</label>
                                  <select value={editForm.aktivno ? "da" : "ne"} onChange={(e) => setEditForm({ ...editForm, aktivno: e.target.value === "da" })}>
                                    <option value="da">Da</option>
                                    <option value="ne">Ne</option>
                                  </select>
                                </div>
                                <div className="form-field">
                                  <label>U voznom parku</label>
                                  <input value={editForm.u_voznom_parku} onChange={(e) => setEditForm({ ...editForm, u_voznom_parku: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Istek registracije</label>
                                  <input type="date" value={editForm.istek_registracije} onChange={(e) => setEditForm({ ...editForm, istek_registracije: e.target.value })} />
                                </div>
                              </div>
                              <div className="form-field" style={{ marginBottom: 14 }}>
                                <label>Napomena</label>
                                <textarea rows={2} value={editForm.napomena} onChange={(e) => setEditForm({ ...editForm, napomena: e.target.value })} />
                              </div>
                              {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}
                              <div style={{ display: "flex", gap: 8 }}>
                                <button className="btn" disabled={saving} onClick={() => handleSave(v.id)}>
                                  {saving ? "Čuvanje..." : "Sačuvaj izmene"}
                                </button>
                                <button className="btn secondary" onClick={cancelEdit}>Otkaži</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={v.id}>
                          <td data-label="Registracija" className="mono">{v.registracija}</td>
                          <td data-label="Marka i tip">{v.marka_tip}</td>
                          <td data-label="Vozač">{v.vozac || "—"}</td>
                          <td data-label="Aktivno"><span className={`pill ${v.aktivno ? "ok" : "neutral"}`}>{v.aktivno ? "Da" : "Ne"}</span></td>
                          <td data-label="" className="cell-block">
                            <div style={{ display: "flex", gap: 8 }}>
                              <button className="btn secondary" onClick={() => startEdit(v)}>Izmeni</button>
                              <button className="btn danger" onClick={() => handleDelete(v)}>Obriši</button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "vozaci" && (
        <>
          <div className="toolbar">
            <strong>Vozači</strong>
            <button className="btn" onClick={() => setShowNewVozacForm((s) => !s)}>
              {showNewVozacForm ? "Otkaži" : "+ Novi vozač"}
            </button>
          </div>

          {showNewVozacForm && (
            <form className="card" onSubmit={handleCreateVozac} style={{ marginBottom: 20 }}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Ime i prezime</label>
                  <input required value={newVozacForm.ime_prezime} onChange={(e) => setNewVozacForm({ ...newVozacForm, ime_prezime: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Telefon</label>
                  <input value={newVozacForm.telefon} onChange={(e) => setNewVozacForm({ ...newVozacForm, telefon: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" value={newVozacForm.email} onChange={(e) => setNewVozacForm({ ...newVozacForm, email: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Broj vozačke dozvole</label>
                  <input value={newVozacForm.broj_vozacke} onChange={(e) => setNewVozacForm({ ...newVozacForm, broj_vozacke: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Kategorija</label>
                  <input placeholder="npr. D, D1, DE" value={newVozacForm.kategorija} onChange={(e) => setNewVozacForm({ ...newVozacForm, kategorija: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Aktivan</label>
                  <select value={newVozacForm.aktivan ? "da" : "ne"} onChange={(e) => setNewVozacForm({ ...newVozacForm, aktivan: e.target.value === "da" })}>
                    <option value="da">Da</option>
                    <option value="ne">Ne</option>
                  </select>
                </div>
              </div>
              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Napomena</label>
                <textarea rows={2} value={newVozacForm.napomena} onChange={(e) => setNewVozacForm({ ...newVozacForm, napomena: e.target.value })} />
              </div>
              {newVozacError && <div className="error-text" style={{ marginBottom: 12 }}>{newVozacError}</div>}
              <button className="btn" type="submit" disabled={savingNewVozac}>
                {savingNewVozac ? "Čuvanje..." : "Sačuvaj vozača"}
              </button>
            </form>
          )}

          <div className="card">
            {loading ? (
  <Skeleton.Table rows={6} cols={4} />
) : vozaciFiltrirani.length === 0 ? (
              <div className="empty-state">{q ? "Nema vozača koji odgovaraju pretrazi." : "Nema unetih vozača."}</div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Ime i prezime</th>
                      <th>Telefon</th>
                      <th>Broj vozačke</th>
                      <th>Aktivan</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vozaciFiltrirani.map((v) =>
                      editingVozacId === v.id ? (
                        <tr key={v.id}>
                          <td colSpan={5}>
                            <div className="admin-edit-box">
                              <div className="form-grid">
                                <div className="form-field">
                                  <label>Ime i prezime</label>
                                  <input value={editVozacForm.ime_prezime} onChange={(e) => setEditVozacForm({ ...editVozacForm, ime_prezime: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Telefon</label>
                                  <input value={editVozacForm.telefon} onChange={(e) => setEditVozacForm({ ...editVozacForm, telefon: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Email</label>
                                  <input type="email" value={editVozacForm.email} onChange={(e) => setEditVozacForm({ ...editVozacForm, email: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Broj vozačke dozvole</label>
                                  <input value={editVozacForm.broj_vozacke} onChange={(e) => setEditVozacForm({ ...editVozacForm, broj_vozacke: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Kategorija</label>
                                  <input value={editVozacForm.kategorija} onChange={(e) => setEditVozacForm({ ...editVozacForm, kategorija: e.target.value })} />
                                </div>
                                <div className="form-field">
                                  <label>Aktivan</label>
                                  <select value={editVozacForm.aktivan ? "da" : "ne"} onChange={(e) => setEditVozacForm({ ...editVozacForm, aktivan: e.target.value === "da" })}>
                                    <option value="da">Da</option>
                                    <option value="ne">Ne</option>
                                  </select>
                                </div>
                              </div>
                              <div className="form-field" style={{ marginBottom: 14 }}>
                                <label>Napomena</label>
                                <textarea rows={2} value={editVozacForm.napomena} onChange={(e) => setEditVozacForm({ ...editVozacForm, napomena: e.target.value })} />
                              </div>
                              {vozacError && <div className="error-text" style={{ marginBottom: 10 }}>{vozacError}</div>}
                              <div style={{ display: "flex", gap: 8 }}>
                                <button className="btn" disabled={savingVozac} onClick={() => handleSaveVozac(v.id)}>
                                  {savingVozac ? "Čuvanje..." : "Sačuvaj izmene"}
                                </button>
                                <button className="btn secondary" onClick={cancelEditVozac}>Otkaži</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={v.id}>
                          <td data-label="Ime i prezime" className="cell-strong">{v.ime_prezime}</td>
                          <td data-label="Telefon" className="mono">{v.telefon || "—"}</td>
                          <td data-label="Broj vozačke" className="mono">{v.broj_vozacke || "—"}</td>
                          <td data-label="Aktivan"><span className={`pill ${v.aktivan ? "ok" : "neutral"}`}>{v.aktivan ? "Da" : "Ne"}</span></td>
                          <td data-label="" className="cell-block">
                            <div style={{ display: "flex", gap: 8 }}>
                              <button className="btn secondary" onClick={() => startEditVozac(v)}>Izmeni</button>
                              <button className="btn danger" onClick={() => handleDeleteVozac(v)}>Obriši</button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "dokumenti" && (
        <>
                    <div className="card" style={{ marginBottom: 28 }}>
            {loading ? (
              <Skeleton.Table rows={6} cols={5} />
            ) : (
              <DokumentGrupaTabela
                grupe={grupeVozila}
                naslovKolone={(v) => (
                  <>
                    <span className="mono cell-strong">{v?.registracija || "—"}</span> · {v?.marka_tip || "—"}
                  </>
                )}
              />
            )}
          </div>

          <div className="toolbar">
            <strong>Dokumenti vozača</strong>
          </div>
                    <div className="card" style={{ marginBottom: dokumentaBezVlasnika.length ? 28 : 0 }}>
            {loading ? (
              <Skeleton.Table rows={4} cols={5} />
            ) : (
              <DokumentGrupaTabela
                grupe={grupeVozaca}
                naslovKolone={(v) => <span className="cell-strong">{v?.ime_prezime || "—"}</span>}
              />
            )}
          </div>

          

          {dokumentaBezVlasnika.length > 0 && (
            <>
              <div className="toolbar">
                <strong>Ostalo (bez povezanog vozila/vozača)</strong>
              </div>
              <div className="card">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Tip</th>
                        <th>Broj</th>
                        <th>Ističe</th>
                        <th>Fajl</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dokumentaBezVlasnika.map((d) => (
                        <tr key={d.id}>
                          <td data-label="Tip">{nazivTipaDokumenta(d.tip)}</td>
                          <td data-label="Broj" className="mono">{d.broj || "—"}</td>
                          <td data-label="Ističe" className="mono">{d.datum_isteka ? formatDatum(d.datum_isteka) : "—"}</td>
                          <td data-label="Fajl" className="cell-block">
                            {d.fajl_url && <button className="btn secondary" onClick={() => handleOpenFile(d.fajl_url)}>Otvori</button>}
                          </td>
                          <td data-label="" className="cell-block">
                            <button className="btn danger" onClick={() => handleDeleteDoc(d)}>Obriši</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === "log" && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <input
              placeholder="Pretraga istorije — opis, korisnik, tabela, akcija..."
              value={logPretraga}
              onChange={(e) => setLogPretraga(e.target.value)}
              style={{ width: "100%" }}
            />
            {logQ && (
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-soft)" }}>
                {logFiltriran.length} od {log.length} zapisa odgovara pretrazi
              </div>
            )}
          </div>

          <div className="toolbar">
            <strong>Istorija izmena</strong>
          </div>
          <div className="card">
            {loading ? (
  <Skeleton.Table rows={6} cols={3} />
) : logFiltriran.length === 0 ? (
              <div className="empty-state">{logQ ? "Nema zapisa koji odgovaraju pretrazi." : "Još uvek nema zabeleženih izmena."}</div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Datum i vreme</th>
                      <th>Opis</th>
                      <th>Korisnik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logFiltriran.map((l) => (
                      <tr key={l.id}>
                        <td data-label="Datum i vreme" className="mono">{new Date(l.created_at).toLocaleString("sr-RS")}</td>
                        <td data-label="Opis">{l.opis}</td>
                        <td data-label="Korisnik">{l.korisnik || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}