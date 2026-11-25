"use client";

import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { zabeleziIzmenu } from "@/lib/log";
import { useToast } from "@/components/Toast";

const PRAZAN = { vozilo_id: "", zemlja: "Srbija", broj_taga: "", napomena: "" };

export default function PutarinePage() {
  return (
    <Suspense fallback={<div className="page-subtitle">Učitavanje...</div>}>
      <PutarineContent />
    </Suspense>
  );
}

function PutarineContent() {
  const supabase = createClient();
  const toast = useToast();
  const searchParams = useSearchParams();
  const preselectVozilo = searchParams.get("vozilo") || "";

  const [putarine, setPutarine] = useState([]);
  const [vozila, setVozila] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!preselectVozilo);
  const [form, setForm] = useState({ ...PRAZAN, vozilo_id: preselectVozilo });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pretraga, setPretraga] = useState("");
  const [filterZemlja, setFilterZemlja] = useState("");
  const [filterBezTaga, setFilterBezTaga] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: v }] = await Promise.all([
      supabase.from("putarine").select("*, vozila(marka_tip, registracija)").order("created_at", { ascending: false }),
      supabase.from("vozila").select("id, marka_tip, registracija").order("registracija"),
    ]);
    setPutarine(p || []);
    setVozila(v || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = { ...form, vozilo_id: form.vozilo_id || null };
    const { error } = await supabase.from("putarine").insert(payload);
    setSaving(false);

    if (error) {
      setError("Greška pri čuvanju: " + error.message);
      toast.error("Greška pri čuvanju putarine: " + error.message);
      return;
    }

    const vozilo = vozila.find((v) => v.id === form.vozilo_id);
    await zabeleziIzmenu(supabase, {
      opis: `Dodata putarina (${form.zemlja})${vozilo ? " za vozilo " + vozilo.registracija : ""}`,
      tabela: "putarine",
      akcija: "dodavanje",
    });

    toast.success(`Putarina za ${form.zemlja} je dodata`);
    setForm(PRAZAN);
    setShowForm(false);
    load();
  }

  async function handleDelete(p) {
    if (!confirm("Obrisati ovaj tag/putarinu?")) return;
    await supabase.from("putarine").delete().eq("id", p.id);
    await zabeleziIzmenu(supabase, {
      opis: `Obrisana putarina (${p.zemlja})${p.vozila ? " za vozilo " + p.vozila.registracija : ""}`,
      tabela: "putarine",
      akcija: "brisanje",
    });
    toast.info("Putarina je obrisana");
    load();
  }

  // Lista svih zemalja koje se pojavljuju (za filter)
  const sveZemlje = useMemo(() => {
    const set = new Set();
    putarine.forEach((p) => p.zemlja && set.add(p.zemlja));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "sr"));
  }, [putarine]);

  // Filtrirane putarine (po zemlji i pretrazi) — samo za standardni prikaz
  const putarineFiltrirane = useMemo(() => {
    let rows = putarine;

    if (filterZemlja) {
      rows = rows.filter((p) => p.zemlja === filterZemlja);
    }

    if (pretraga.trim()) {
      const q = pretraga.toLowerCase();
      rows = rows.filter((p) =>
        [p.zemlja, p.broj_taga, p.napomena, p.vozila?.registracija, p.vozila?.marka_tip]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      );
    }

    return rows;
  }, [putarine, filterZemlja, pretraga]);

  // Statistika: broj tagova po zemlji + broj vozila bez taga
  const statistika = useMemo(() => {
    const poZemlji = {};
    putarine.forEach((p) => {
      if (p.zemlja) {
        poZemlji[p.zemlja] = (poZemlji[p.zemlja] || 0) + 1;
      }
    });

    const vozilaSaTagom = new Set();
    putarine.forEach((p) => {
      if (p.vozilo_id) vozilaSaTagom.add(p.vozilo_id);
    });

    const vozilaBezTaga = vozila.filter((v) => !vozilaSaTagom.has(v.id)).length;

    return {
      poZemlji,
      vozilaSaTagom: vozilaSaTagom.size,
      vozilaBezTaga,
      ukupnoTagova: putarine.length,
    };
  }, [putarine, vozila]);

  // Grupisanje po vozilu
  const grupeVozila = useMemo(() => {
    // Ako je filter "Bez taga" aktivan → prikaži vozila bez ijedne putarine
    if (filterBezTaga) {
      const vozilaSaTagom = new Set();
      putarine.forEach((p) => {
        if (p.vozilo_id) vozilaSaTagom.add(p.vozilo_id);
      });

      let vozilaBezTaga = vozila.filter((v) => !vozilaSaTagom.has(v.id));

      if (pretraga.trim()) {
        const q = pretraga.toLowerCase();
        vozilaBezTaga = vozilaBezTaga.filter((v) =>
          [v.registracija, v.marka_tip].filter(Boolean).some((x) => x.toLowerCase().includes(q))
        );
      }

      return vozilaBezTaga.map((v) => ({
        kljuc: v.id,
        vlasnik: v,
        putarine: [],
        bezTaga: true,
      }));
    }

    // Standardno grupisanje — po vozilu iz filtriranih putarina
    const mapa = new Map();
    putarineFiltrirane.forEach((p) => {
      const kljuc = p.vozilo_id || "__bez_vozila__";
      if (!mapa.has(kljuc)) {
        mapa.set(kljuc, {
          kljuc,
          vlasnik: p.vozila || null,
          putarine: [],
          bezTaga: false,
        });
      }
      mapa.get(kljuc).putarine.push(p);
    });

    const grupe = Array.from(mapa.values());
    grupe.sort((a, b) => {
      // Grupa "bez vozila" ide na kraj
      if (!a.vlasnik && b.vlasnik) return 1;
      if (a.vlasnik && !b.vlasnik) return -1;
      return (a.vlasnik?.registracija || "").localeCompare(b.vlasnik?.registracija || "");
    });
    return grupe;
  }, [putarineFiltrirane, putarine, vozila, filterBezTaga, pretraga]);

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Putarine</h1>
          <p className="page-subtitle">TAG uređaji po vozilu i po zemlji (Srbija, Mađarska...).</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Otkaži" : "+ Nova putarina"}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="form-grid">
            <div className="form-field">
              <label>Vozilo</label>
              <select value={form.vozilo_id} onChange={(e) => setForm({ ...form, vozilo_id: e.target.value })}>
                <option value="">— bez vozila —</option>
                {vozila.map((v) => (
                  <option key={v.id} value={v.id}>{v.marka_tip} · {v.registracija}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Zemlja</label>
              <input
                required
                list="zemlje-lista"
                value={form.zemlja}
                onChange={(e) => setForm({ ...form, zemlja: e.target.value })}
              />
              <datalist id="zemlje-lista">
                {sveZemlje.map((z) => <option key={z} value={z} />)}
                <option value="Srbija" />
                <option value="Mađarska" />
                <option value="Hrvatska" />
                <option value="Rumunija" />
                <option value="Bugarska" />
                <option value="Severna Makedonija" />
                <option value="Bosna i Hercegovina" />
                <option value="Crna Gora" />
                <option value="Slovenija" />
                <option value="Austrija" />
                <option value="Nemačka" />
              </datalist>
            </div>
            <div className="form-field">
              <label>Broj taga</label>
              <input value={form.broj_taga} onChange={(e) => setForm({ ...form, broj_taga: e.target.value })} />
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

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-grid" style={{ marginBottom: 14 }}>
          <input
            placeholder="Pretraga po zemlji, broju taga, vozilu, napomeni..."
            value={pretraga}
            onChange={(e) => setPretraga(e.target.value)}
          />
        </div>

        {sveZemlje.length > 0 && (
          <div className="kategorija-row" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className={`kategorija-btn ${filterZemlja === "" && !filterBezTaga ? "active" : ""}`}
              onClick={() => {
                setFilterZemlja("");
                setFilterBezTaga(false);
              }}
            >
              Sve
            </button>
            {sveZemlje.map((z) => (
              <button
                key={z}
                type="button"
                className={`kategorija-btn ${filterZemlja === z && !filterBezTaga ? "active" : ""}`}
                onClick={() => {
                  setFilterZemlja(z);
                  setFilterBezTaga(false);
                }}
              >
                {z}
              </button>
            ))}
            <button
              type="button"
              className={`kategorija-btn ${filterBezTaga ? "active" : ""}`}
              onClick={() => {
                setFilterBezTaga((b) => !b);
                setFilterZemlja("");
              }}
              style={filterBezTaga ? {} : { borderColor: "rgba(234, 179, 8, 0.4)", color: "#ca8a04" }}
            >
              ⚠ Vozila bez taga ({statistika.vozilaBezTaga})
            </button>
          </div>
        )}

        {/* Statistika */}
        <div className="putarine-statistika">
          {sveZemlje.map((z) => (
            <div key={z} className="putarine-stat-item">
              <span className="putarine-stat-label">{z}</span>
              <span className="putarine-stat-vrednost">
                {statistika.poZemlji[z] || 0}
              </span>
              <span className="putarine-stat-jedinica">
                {statistika.poZemlji[z] === 1 ? "tag" : "tagova"}
              </span>
            </div>
          ))}
          <div className="putarine-stat-item warn">
            <span className="putarine-stat-label">⚠ Vozila bez taga</span>
            <span className="putarine-stat-vrednost">{statistika.vozilaBezTaga}</span>
            <span className="putarine-stat-jedinica">
              {statistika.vozilaBezTaga === 1 ? "vozilo" : "vozila"}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Učitavanje...</div>
        ) : grupeVozila.length === 0 ? (
          <div className="empty-state">
            {filterBezTaga
              ? "Sva vozila imaju unet bar jedan tag."
              : putarine.length === 0
              ? "Nema unetih putarina."
              : "Nema putarina koje odgovaraju filteru."}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Zemlja</th>
                  <th>Broj taga</th>
                  <th>Napomena</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {grupeVozila.map((g) => (
                  <Fragment key={g.kljuc}>
                    <tr className="doc-group-header">
                      <td colSpan={4}>
                        {g.vlasnik ? (
                          <>
                            <span className="mono cell-strong">{g.vlasnik.registracija}</span> · {g.vlasnik.marka_tip}
                          </>
                        ) : (
                          <span className="cell-strong">Bez vozila</span>
                        )}
                        {!g.bezTaga && (
                          <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--ink-soft)", fontSize: 12 }}>
                            ({g.putarine.length} {g.putarine.length === 1 ? "tag" : "taga"})
                          </span>
                        )}
                        {g.bezTaga && (
                          <span style={{ marginLeft: 8, fontWeight: 400, color: "#ca8a04", fontSize: 12 }}>
                            ⚠ bez taga
                          </span>
                        )}
                      </td>
                    </tr>
                    {g.putarine.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-soft)", fontStyle: "italic", padding: "14px 10px" }}>
                          Ovo vozilo nema unet nijedan tag.
                        </td>
                      </tr>
                    ) : (
                      g.putarine.map((p) => (
                        <tr key={p.id}>
                          <td data-label="Zemlja">{p.zemlja}</td>
                          <td data-label="Broj taga" className="mono">{p.broj_taga || "—"}</td>
                          <td data-label="Napomena">{p.napomena || "—"}</td>
                          <td data-label="" className="cell-block">
                            <button className="btn secondary" onClick={() => handleDelete(p)}>Obriši</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}