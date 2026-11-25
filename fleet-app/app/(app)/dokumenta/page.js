"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Fragment } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sigurnoImeFajla } from "@/lib/sigurnoImeFajla";
import { nazivTipaDokumenta, TIPOVI_DOKUMENATA_VOZILO, TIPOVI_DOKUMENATA_VOZAC } from "@/lib/tipDokumenta";
import { zabeleziIzmenu } from "@/lib/log";
import StatusPill, { rokStatus } from "@/components/StatusPill";
import ReplaceFileButton from "@/components/ReplaceFileButton";
import { useToast } from "@/components/Toast";
import Skeleton from "@/components/Skeleton";

const PRAZAN = {
  vlasnik: "vozilo",
  vozilo_id: "",
  vozac_id: "",
  tip: "registracija",
  broj: "",
  izdavalac: "",
  datum_izdavanja: "",
  datum_isteka: "",
  napomena: "",
};

export default function DokumentaPage() {
  return (
    <Suspense fallback={<div className="page-subtitle">Učitavanje...</div>}>
      <DokumentaContent />
    </Suspense>
  );
}

function DokumentaContent() {
  const supabase = createClient();
  const toast = useToast();
  const searchParams = useSearchParams();
  const preselectVozilo = searchParams.get("vozilo") || "";
  const preselectVozac = searchParams.get("vozac") || "";

  const [dokumenta, setDokumenta] = useState([]);
  const [vozila, setVozila] = useState([]);
  const [vozaci, setVozaci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!preselectVozilo || !!preselectVozac);
  const [form, setForm] = useState({
    ...PRAZAN,
    vlasnik: preselectVozac ? "vozac" : "vozilo",
    vozilo_id: preselectVozilo,
    vozac_id: preselectVozac,
    tip: preselectVozac ? "vozacka_dozvola" : "registracija",
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pretraga, setPretraga] = useState("");
  const [filterVozilo, setFilterVozilo] = useState(preselectVozilo);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: d }, { data: v }, { data: vc }] = await Promise.all([
      supabase.from("dokumenta").select("*, vozila(marka_tip, registracija), vozaci(ime_prezime)").order("datum_isteka", { ascending: true }),
      supabase.from("vozila").select("id, marka_tip, registracija").order("registracija"),
      supabase.from("vozaci").select("id, ime_prezime").order("ime_prezime"),
    ]);
    setDokumenta(d || []);
    setVozila(v || []);
    setVozaci(vc || []);
    setLoading(false);
  }

  function opisVlasnika(d) {
    if (d.vozila) return `${d.vozila.marka_tip} · ${d.vozila.registracija}`;
    if (d.vozaci) return `${d.vozaci.ime_prezime} (vozač)`;
    return "—";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    let fajl_url = null;

    if (file) {
      const putanja = `${Date.now()}-${sigurnoImeFajla(file.name)}`;
      const { error: uploadError } = await supabase.storage.from("dokumenti").upload(putanja, file);
      if (uploadError) {
        setError("Greška pri otpremanju fajla: " + uploadError.message);
        toast.error("Greška pri otpremanju fajla: " + uploadError.message);
        setSaving(false);
        return;
      }
      fajl_url = putanja;
    }

    const payload = {
      vozilo_id: form.vlasnik === "vozilo" ? form.vozilo_id || null : null,
      vozac_id: form.vlasnik === "vozac" ? form.vozac_id || null : null,
      tip: form.tip,
      broj: form.broj,
      izdavalac: form.izdavalac,
      datum_izdavanja: form.datum_izdavanja || null,
      datum_isteka: form.datum_isteka || null,
      napomena: form.napomena,
      fajl_url,
    };

    const { error } = await supabase.from("dokumenta").insert(payload);
    setSaving(false);

    if (error) {
      setError("Greška pri čuvanju: " + error.message);
      toast.error("Greška pri čuvanju dokumenta: " + error.message);
      return;
    }

    const vozilo = vozila.find((v) => v.id === payload.vozilo_id);
    const vozac = vozaci.find((v) => v.id === payload.vozac_id);
    await zabeleziIzmenu(supabase, {
      opis: `Dodat dokument (${nazivTipaDokumenta(form.tip)})${vozilo ? " za vozilo " + vozilo.registracija : ""}${vozac ? " za vozača " + vozac.ime_prezime : ""}`,
      tabela: "dokumenta",
      akcija: "dodavanje",
    });

    toast.success(`Dokument (${nazivTipaDokumenta(form.tip)}) je dodat`);
    setForm(PRAZAN);
    setFile(null);
    setShowForm(false);
    load();
  }

  async function handleDelete(d) {
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

  async function handleOpen(fajl_url) {
    const { data } = await supabase.storage.from("dokumenti").createSignedUrl(fajl_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Fajl nije moguće otvoriti");
  }

  async function handleProduziRegistraciju(d) {
    const trenutni = d.datum_isteka ? new Date(d.datum_isteka) : new Date();
    trenutni.setFullYear(trenutni.getFullYear() + 1);
    const noviDatum = trenutni.toISOString().slice(0, 10);

    if (!confirm(`Postaviti novi datum isteka registracije na ${new Date(noviDatum).toLocaleDateString("sr-RS")}?`)) return;

    const { error } = await supabase.from("dokumenta").update({ datum_isteka: noviDatum }).eq("id", d.id);

    if (error) {
      toast.error("Greška pri produženju registracije: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: `Produžena registracija${d.vozila ? " vozila " + d.vozila.registracija : ""} do ${new Date(noviDatum).toLocaleDateString("sr-RS")}`,
      tabela: "dokumenta",
      akcija: "izmena",
    });

    toast.success(`Registracija produžena do ${new Date(noviDatum).toLocaleDateString("sr-RS")}`);
    load();
  }

  // Filtriranje dokumenata (pretraga + filter vozila)
  const dokumentaFiltrirana = useMemo(() => {
    let rows = dokumenta;
    if (filterVozilo) rows = rows.filter((d) => d.vozilo_id === filterVozilo);
    if (pretraga.trim()) {
      const q = pretraga.toLowerCase();
      rows = rows.filter((d) =>
        [d.tip, d.broj, d.izdavalac, d.napomena, d.vozila?.registracija, d.vozila?.marka_tip, d.vozaci?.ime_prezime]
          .filter(Boolean)
          .some((val) => val.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [dokumenta, pretraga, filterVozilo]);

  // Grupisanje po vozilima
  const grupeVozila = useMemo(() => {
    const mapa = new Map();
    dokumentaFiltrirana
      .filter((d) => d.vozilo_id)
      .forEach((d) => {
        if (!mapa.has(d.vozilo_id)) {
          mapa.set(d.vozilo_id, { kljuc: d.vozilo_id, vlasnik: d.vozila, dokumenti: [] });
        }
        mapa.get(d.vozilo_id).dokumenti.push(d);
      });
    const grupe = Array.from(mapa.values());
    grupe.sort((a, b) => (a.vlasnik?.registracija || "").localeCompare(b.vlasnik?.registracija || ""));
    return grupe;
  }, [dokumentaFiltrirana]);

  // Grupisanje po vozačima
  const grupeVozaca = useMemo(() => {
    const mapa = new Map();
    dokumentaFiltrirana
      .filter((d) => d.vozac_id)
      .forEach((d) => {
        if (!mapa.has(d.vozac_id)) {
          mapa.set(d.vozac_id, { kljuc: d.vozac_id, vlasnik: d.vozaci, dokumenti: [] });
        }
        mapa.get(d.vozac_id).dokumenti.push(d);
      });
    const grupe = Array.from(mapa.values());
    grupe.sort((a, b) => (a.vlasnik?.ime_prezime || "").localeCompare(b.vlasnik?.ime_prezime || ""));
    return grupe;
  }, [dokumentaFiltrirana]);

  // Dokumenti bez vlasnika
  const dokumentaBezVlasnika = useMemo(
    () => dokumentaFiltrirana.filter((d) => !d.vozilo_id && !d.vozac_id),
    [dokumentaFiltrirana]
  );

  const tipoviZaVlasnika = form.vlasnik === "vozac" ? TIPOVI_DOKUMENATA_VOZAC : TIPOVI_DOKUMENATA_VOZILO;

  // Zajednička tabela za grupe (koristi se za vozila i vozače)
  function GrupaTabela({ grupe, naslovKolone }) {
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Tip</th>
              <th>Broj</th>
              <th>Izdavalac</th>
              <th>Ističe</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {grupe.map((g) => (
              <Fragment key={g.kljuc}>
                <tr className="doc-group-header">
                  <td colSpan={6}>{naslovKolone(g.vlasnik)}</td>
                </tr>
                {g.dokumenti.map((d) => {
                  const s = rokStatus(d.datum_isteka);
                  return (
                    <tr key={d.id}>
                      <td data-label="Tip">{nazivTipaDokumenta(d.tip)}</td>
                      <td data-label="Broj" className="mono">{d.broj || "—"}</td>
                      <td data-label="Izdavalac">{d.izdavalac || "—"}</td>
                      <td data-label="Ističe" className="mono">{d.datum_isteka ? new Date(d.datum_isteka).toLocaleDateString("sr-RS") : "—"}</td>
                      <td data-label="Status"><StatusPill label={s.label} tone={s.tone} /></td>
                      <td data-label="" className="cell-block">
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {d.fajl_url && (
                            <button className="btn secondary" onClick={() => handleOpen(d.fajl_url)}>Otvori</button>
                          )}
                          {d.tip === "registracija" && (
                            <button className="btn secondary" onClick={() => handleProduziRegistraciju(d)} title="Postavlja novi datum isteka na tačno godinu dana od trenutnog">
                              +1 godina
                            </button>
                          )}
                          <ReplaceFileButton
                            docId={d.id}
                            oldFajlUrl={d.fajl_url}
                            opisZaLog={`Zamenjen fajl dokumenta (${nazivTipaDokumenta(d.tip)})`}
                            onChanged={load}
                          />
                          <button className="btn secondary" onClick={() => handleDelete(d)}>Obriši</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Dokumenti</h1>
          <p className="page-subtitle">Dokumenta vozila i vozača, grupisana po vlasniku.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Otkaži" : "+ Novi dokument"}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="form-grid">
            <div className="form-field">
              <label>Dokument se odnosi na</label>
              <select
                value={form.vlasnik}
                onChange={(e) => setForm({ ...form, vlasnik: e.target.value, tip: e.target.value === "vozac" ? "vozacka_dozvola" : "registracija" })}
              >
                <option value="vozilo">Vozilo</option>
                <option value="vozac">Vozača</option>
              </select>
            </div>
            {form.vlasnik === "vozilo" ? (
              <div className="form-field">
                <label>Vozilo</label>
                <select value={form.vozilo_id} onChange={(e) => setForm({ ...form, vozilo_id: e.target.value })}>
                  <option value="">— bez vozila —</option>
                  {vozila.map((v) => (
                   <option key={v.id} value={v.id}>{v.marka_tip} · {v.registracija}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-field">
                <label>Vozač</label>
                <select value={form.vozac_id} onChange={(e) => setForm({ ...form, vozac_id: e.target.value })}>
                  <option value="">— izaberi vozača —</option>
                  {vozaci.map((v) => (
                    <option key={v.id} value={v.id}>{v.ime_prezime}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-field">
              <label>Tip dokumenta</label>
              <select value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })}>
                {tipoviZaVlasnika.map((t) => <option key={t} value={t}>{nazivTipaDokumenta(t)}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Broj (polise/dokumenta)</label>
              <input value={form.broj} onChange={(e) => setForm({ ...form, broj: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Izdavalac (osig. kuća / institucija)</label>
              <input value={form.izdavalac} onChange={(e) => setForm({ ...form, izdavalac: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Datum izdavanja</label>
              <input type="date" required value={form.datum_izdavanja} onChange={(e) => setForm({ ...form, datum_izdavanja: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Datum isteka</label>
              <input type="date" value={form.datum_isteka} onChange={(e) => setForm({ ...form, datum_isteka: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Fajl (PDF/skenirani dokument)</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label>Napomena</label>
            <textarea rows={2} value={form.napomena} onChange={(e) => setForm({ ...form, napomena: e.target.value })} />
          </div>
          {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Čuvanje..." : "Sačuvaj dokument"}
          </button>
        </form>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-grid" style={{ marginBottom: 0 }}>
          <input
            placeholder="Pretraga po tipu, broju, izdavaocu, napomeni..."
            value={pretraga}
            onChange={(e) => setPretraga(e.target.value)}
          />
          <select value={filterVozilo} onChange={(e) => setFilterVozilo(e.target.value)}>
            <option value="">— sva vozila —</option>
            {vozila.map((v) => (
              <option key={v.id} value={v.id}>{v.marka_tip} · {v.registracija}</option>
            ))}
          </select>
        </div>
      </div>

            {loading ? (
        <Skeleton.Table rows={8} cols={6} />
      ) : dokumentaFiltrirana.length === 0 ? (
        <div className="empty-state">Nema dokumenata koji odgovaraju filteru.</div>
      ) : (
        <>
          {grupeVozila.length > 0 && (
            <>
              <div className="toolbar">
                <strong>Dokumenti vozila</strong>
              </div>
              <div className="card" style={{ marginBottom: 28 }}>
                <GrupaTabela
                  grupe={grupeVozila}
                  naslovKolone={(v) => (
                    <>
                      <span className="mono cell-strong">{v?.registracija || "—"}</span> · {v?.marka_tip || "—"}
                    </>
                  )}
                />
              </div>
            </>
          )}

          {grupeVozaca.length > 0 && (
            <>
              <div className="toolbar">
                <strong>Dokumenti vozača</strong>
              </div>
              <div className="card" style={{ marginBottom: 28 }}>
                <GrupaTabela
                  grupe={grupeVozaca}
                  naslovKolone={(v) => <span className="cell-strong">{v?.ime_prezime || "—"}</span>}
                />
              </div>
            </>
          )}

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
                        <th>Izdavalac</th>
                        <th>Ističe</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dokumentaBezVlasnika.map((d) => {
                        const s = rokStatus(d.datum_isteka);
                        return (
                          <tr key={d.id}>
                            <td data-label="Tip">{nazivTipaDokumenta(d.tip)}</td>
                            <td data-label="Broj" className="mono">{d.broj || "—"}</td>
                            <td data-label="Izdavalac">{d.izdavalac || "—"}</td>
                            <td data-label="Ističe" className="mono">{d.datum_isteka ? new Date(d.datum_isteka).toLocaleDateString("sr-RS") : "—"}</td>
                            <td data-label="Status"><StatusPill label={s.label} tone={s.tone} /></td>
                            <td data-label="" className="cell-block">
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {d.fajl_url && (
                                  <button className="btn secondary" onClick={() => handleOpen(d.fajl_url)}>Otvori</button>
                                )}
                                <ReplaceFileButton
                                  docId={d.id}
                                  oldFajlUrl={d.fajl_url}
                                  opisZaLog={`Zamenjen fajl dokumenta (${nazivTipaDokumenta(d.tip)})`}
                                  onChanged={load}
                                />
                                <button className="btn secondary" onClick={() => handleDelete(d)}>Obriši</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}