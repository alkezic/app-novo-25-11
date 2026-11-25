"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Printer, Trash2, ImagePlus, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sigurnoImeFajla } from "@/lib/sigurnoImeFajla";
import { zabeleziIzmenu } from "@/lib/log";
import StatusPill, { rokStatus } from "@/components/StatusPill";
import { nazivTipaDokumenta } from "@/lib/tipDokumenta";
import { formatDatum } from "@/lib/datum";
import { useToast } from "@/components/Toast";

const PRAZAN_SERVIS = {
  datum_servisa: "",
  tip_servisa: "redovan",
  kilometraza: "",
  kilometraza_sledeci_servis: "",
  majstor_servis: "",
  opis: "",
  zapazeni_kvarovi: "",
};

export default function VoziloDetailPage() {
  const { id } = useParams();
  const supabase = createClient();
  const toast = useToast();

  const [vozilo, setVozilo] = useState(null);
  const [dokumenta, setDokumenta] = useState([]);
  const [putarine, setPutarine] = useState([]);
  const [racuni, setRacuni] = useState([]);
  const [fotografije, setFotografije] = useState([]);
  const [odrzavanje, setOdrzavanje] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fotoInputRef = useRef(null);

  const [showServisForm, setShowServisForm] = useState(false);
  const [servisForm, setServisForm] = useState(PRAZAN_SERVIS);
  const [savingServis, setSavingServis] = useState(false);
  const [servisError, setServisError] = useState("");

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    const { data: v } = await supabase.from("vozila").select("*, vozaci(id, ime_prezime)").eq("id", id).single();

    if (!v) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const [{ data: d }, { data: p }, { data: r }, { data: f }, { data: o }] = await Promise.all([
      supabase.from("dokumenta").select("*").eq("vozilo_id", id).order("datum_isteka", { ascending: true }),
      supabase.from("putarine").select("*").eq("vozilo_id", id),
      supabase.from("racuni").select("*, partneri(naziv)").eq("vozilo_id", id).order("rok_placanja", { ascending: true }),
      supabase.from("vozilo_fotografije").select("*").eq("vozilo_id", id).order("glavna", { ascending: false }).order("created_at", { ascending: true }),
      supabase.from("odrzavanje").select("*").eq("vozilo_id", id).order("datum_servisa", { ascending: false }),
    ]);

    setVozilo(v);
    setDokumenta(d || []);
    setPutarine(p || []);
    setRacuni(r || []);
    setOdrzavanje(o || []);

    const fotoSaLinkovima = await Promise.all(
      (f || []).map(async (foto) => {
        const { data: signed } = await supabase.storage.from("dokumenti").createSignedUrl(foto.fajl_url, 3600);
        return { ...foto, url: signed?.signedUrl || null };
      })
    );
    setFotografije(fotoSaLinkovima);

    setLoading(false);
  }

  async function handleProduziRegistraciju() {
    const trenutni = vozilo.istek_registracije ? new Date(vozilo.istek_registracije) : new Date();
    trenutni.setFullYear(trenutni.getFullYear() + 1);
    const noviDatum = trenutni.toISOString().slice(0, 10);

    if (!confirm(`Postaviti novi datum isteka registracije na ${formatDatum(noviDatum)}?`)) return;

    const { error } = await supabase.from("vozila").update({ istek_registracije: noviDatum }).eq("id", id);

    if (error) {
      toast.error("Greška pri produženju registracije: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: `Produžena registracija vozila ${vozilo.registracija} do ${formatDatum(noviDatum)}`,
      tabela: "vozila",
      akcija: "izmena",
    });
    toast.success(`Registracija vozila ${vozilo.registracija} produžena do ${formatDatum(noviDatum)}`);
    load();
  }

  async function handleOpenFile(fajl_url) {
    const { data } = await supabase.storage.from("dokumenti").createSignedUrl(fajl_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Fajl nije moguće otvoriti");
  }

  async function handleUploadFoto(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingFoto(true);

    let uspeha = 0;
    let greske = 0;

    for (const file of files) {
      const putanja = `foto/${id}-${Date.now()}-${sigurnoImeFajla(file.name)}`;
      const { error: uploadError } = await supabase.storage.from("dokumenti").upload(putanja, file);
      if (!uploadError) {
        await supabase.from("vozilo_fotografije").insert({ vozilo_id: id, fajl_url: putanja });
        uspeha++;
      } else {
        greske++;
      }
    }

    await zabeleziIzmenu(supabase, {
      opis: `Dodate fotografije za vozilo ${vozilo.registracija}`,
      tabela: "vozilo_fotografije",
      akcija: "otpremanje fajla",
    });

    setUploadingFoto(false);
    e.target.value = "";

    if (uspeha > 0 && greske === 0) {
      toast.success(uspeha === 1 ? "Fotografija je dodata" : `Dodato ${uspeha} fotografija`);
    } else if (uspeha > 0 && greske > 0) {
      toast.info(`Dodato ${uspeha} od ${uspeha + greske} fotografija (${greske} neuspešno)`);
    } else {
      toast.error("Greška pri otpremanju fotografija");
    }

    load();
  }

  async function handleSetGlavna(foto) {
    await supabase.from("vozilo_fotografije").update({ glavna: false }).eq("vozilo_id", id);
    await supabase.from("vozilo_fotografije").update({ glavna: true }).eq("id", foto.id);
    await zabeleziIzmenu(supabase, {
      opis: `Promenjena glavna fotografija za vozilo ${vozilo.registracija}`,
      tabela: "vozilo_fotografije",
      akcija: "izmena",
    });
    toast.success("Glavna fotografija je promenjena");
    load();
  }

  async function handleDeleteFoto(foto) {
    if (!confirm("Obrisati ovu fotografiju?")) return;
    await supabase.from("vozilo_fotografije").delete().eq("id", foto.id);
    try {
      await supabase.storage.from("dokumenti").remove([foto.fajl_url]);
    } catch {
      // nije kritično ako fajl ne može da se obriše iz storage-a
    }
    await zabeleziIzmenu(supabase, {
      opis: `Obrisana fotografija za vozilo ${vozilo.registracija}`,
      tabela: "vozilo_fotografije",
      akcija: "brisanje",
    });
    toast.info("Fotografija je obrisana");
    load();
  }

  async function handleSubmitServis(e) {
    e.preventDefault();
    setSavingServis(true);
    setServisError("");

    const payload = {
      vozilo_id: id,
      datum_servisa: servisForm.datum_servisa,
      tip_servisa: servisForm.tip_servisa,
      kilometraza: servisForm.kilometraza ? Number(servisForm.kilometraza) : null,
      kilometraza_sledeci_servis: servisForm.kilometraza_sledeci_servis ? Number(servisForm.kilometraza_sledeci_servis) : null,
      majstor_servis: servisForm.majstor_servis || null,
      opis: servisForm.opis || null,
      zapazeni_kvarovi: servisForm.zapazeni_kvarovi || null,
    };

    const { error } = await supabase.from("odrzavanje").insert(payload);
    setSavingServis(false);

    if (error) {
      setServisError("Greška pri čuvanju: " + error.message);
      toast.error("Greška pri čuvanju servisa: " + error.message);
      return;
    }

    await zabeleziIzmenu(supabase, {
      opis: `Dodat unos održavanja za vozilo ${vozilo.registracija}`,
      tabela: "odrzavanje",
      akcija: "dodavanje",
    });

    toast.success("Servis je dodat");
    setServisForm(PRAZAN_SERVIS);
    setShowServisForm(false);
    load();
  }

  async function handleDeleteServis(s) {
    if (!confirm("Obrisati ovaj unos održavanja?")) return;
    await supabase.from("odrzavanje").delete().eq("id", s.id);
    await zabeleziIzmenu(supabase, {
      opis: `Obrisan unos održavanja za vozilo ${vozilo.registracija}`,
      tabela: "odrzavanje",
      akcija: "brisanje",
    });
    toast.info("Servis je obrisan");
    load();
  }

  function handlePrint() {
    window.print();
  }

  async function handleDownloadFotografije() {
    toast.info(`Preuzimanje ${fotografije.length} fotografija...`);
    for (const f of fotografije) {
      if (!f.url) continue;
      const res = await fetch(f.url);
      const blob = await res.blob();
      const ext = f.fajl_url.split(".").pop() || "jpg";
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${vozilo.registracija}-${f.id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      await new Promise((r) => setTimeout(r, 300));
    }
    toast.success("Fotografije su preuzete");
  }

  if (loading) return <div className="page-subtitle">Učitavanje...</div>;

  if (notFound || !vozilo) {
    return (
      <div>
        <Link href="/vozila" className="back-link"><ArrowLeft size={15} /> Nazad na vozila</Link>
        <div className="empty-state">Vozilo nije pronađeno.</div>
      </div>
    );
  }

  const glavnaFotografija = fotografije[0];

  return (
    <div>
      <div className="print-only">
        <h1>{vozilo.marka_tip}</h1>
        <div className="print-plate">{vozilo.registracija}</div>
        {glavnaFotografija?.url && (
          <img src={glavnaFotografija.url} alt="Fotografija vozila" className="print-photo" />
        )}
        <table className="print-info-table">
          <tbody>
            <tr><td>Godina proizvodnje</td><td>{vozilo.godina || "—"}</td></tr>
            <tr><td>Broj šasije (VIN)</td><td>{vozilo.vin || "—"}</td></tr>
            <tr><td>Broj sedišta</td><td>{vozilo.broj_sedista ?? "—"}</td></tr>
            <tr><td>Vrsta vozila</td><td>{vozilo.vrsta_vozila || "—"}</td></tr>
            <tr><td>Vozač</td><td>{vozilo.vozaci?.ime_prezime || vozilo.vozac || "—"}</td></tr>
            <tr><td>Vlasništvo</td><td>{vozilo.vlasnistvo || "—"}{vozilo.vlasnistvo === "lizing" && vozilo.lizing_br_ugovora ? ` (ugovor: ${vozilo.lizing_br_ugovora})` : ""}</td></tr>
            <tr><td>Aktivno</td><td>{vozilo.aktivno ? "Da" : "Ne"}</td></tr>
            <tr><td>U voznom parku</td><td>{vozilo.u_voznom_parku || "—"}</td></tr>
            <tr><td>Istek registracije</td><td>{vozilo.istek_registracije ? formatDatum(vozilo.istek_registracije) : "—"}</td></tr>
            {vozilo.napomena && <tr><td>Napomena</td><td>{vozilo.napomena}</td></tr>}
          </tbody>
        </table>
        {dokumenta.length > 0 && (
          <>
            <h3>Dokumenta</h3>
            <table className="print-info-table">
              <tbody>
                {dokumenta.map((d) => (
                  <tr key={d.id}>
                    <td>{nazivTipaDokumenta(d.tip)}</td>
                    <td>{d.datum_isteka ? "ističe " + formatDatum(d.datum_isteka) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="no-print">
        <Link href="/vozila" className="back-link"><ArrowLeft size={15} /> Nazad na vozila</Link>

        <div className="detail-header">
          <div>
            <h1 className="page-title mono">{vozilo.registracija}</h1>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span className={`pill ${vozilo.aktivno ? "ok" : "neutral"}`}>{vozilo.aktivno ? "Aktivno" : "Neaktivno"}</span>
            {vozilo.u_voznom_parku && (
              <span className={`pill ${/istek/i.test(vozilo.u_voznom_parku) ? "danger" : vozilo.u_voznom_parku.toUpperCase() === "DA" ? "ok" : "warn"}`}>
                U voznom parku: {vozilo.u_voznom_parku}
              </span>
            )}
            <button className="btn secondary" onClick={handlePrint}>
              <Printer size={14} /> Štampaj / Izvezi PDF
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="toolbar">
            <strong>Fotografije</strong>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {fotografije.length > 0 && (
                <button className="btn secondary" onClick={handleDownloadFotografije}>
                  <Download size={14} /> Preuzmi fotografije
                </button>
              )}
              <button className="btn secondary" onClick={() => fotoInputRef.current?.click()} disabled={uploadingFoto}>
                <ImagePlus size={14} /> {uploadingFoto ? "Otpremanje..." : "Dodaj fotografije"}
              </button>
            </div>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleUploadFoto}
            />
          </div>
          {fotografije.length === 0 ? (
            <div className="empty-state">Nema dodatih fotografija. Glavna fotografija (istaknuta zvezdicom) se koristi na štampanoj ličnoj karti vozila.</div>
          ) : (
            <div className="foto-grid">
              {fotografije.map((f) => {
                const jeGlavna = f.glavna || (fotografije.every((x) => !x.glavna) && f.id === fotografije[0].id);
                return (
                  <div key={f.id} className="foto-thumb">
                    {f.url && <img src={f.url} alt="Fotografija vozila" />}
                    {jeGlavna && <span className="foto-glavna-label">Glavna</span>}
                    <button className="foto-delete" onClick={() => handleDeleteFoto(f)} title="Obriši fotografiju">
                      <Trash2 size={13} />
                    </button>
                    {!jeGlavna && (
                      <button className="foto-set-glavna" onClick={() => handleSetGlavna(f)}>
                        Postavi kao glavnu
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="info-grid">
            <div className="info-item"><span>Marka i tip vozila</span><strong>{vozilo.marka_tip}</strong></div>
            <div className="info-item"><span>Godina proizvodnje</span><strong className="mono">{vozilo.godina || "—"}</strong></div>
            <div className="info-item"><span>Broj šasije (VIN)</span><strong className="mono">{vozilo.vin || "—"}</strong></div>
            <div className="info-item"><span>Broj sedišta</span><strong className="mono">{vozilo.broj_sedista ?? "—"}</strong></div>
            <div className="info-item"><span>Vrsta vozila</span><strong>{vozilo.vrsta_vozila || "—"}</strong></div>
            <div className="info-item">
              <span>Vozač</span>
              <strong>
                {vozilo.vozaci ? (
                  <Link href={`/vozaci/${vozilo.vozaci.id}`} style={{ color: "var(--accent)" }}>{vozilo.vozaci.ime_prezime}</Link>
                ) : (
                  vozilo.vozac || "—"
                )}
              </strong>
            </div>
            <div className="info-item"><span>Vlasništvo</span><strong>{vozilo.vlasnistvo || "—"}</strong></div>
            {vozilo.vlasnistvo === "lizing" && (
              <div className="info-item"><span>Broj ugovora o lizingu</span><strong className="mono">{vozilo.lizing_br_ugovora || "—"}</strong></div>
            )}
            <div className="info-item">
              <span>Istek registracije</span>
              <strong style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {vozilo.istek_registracije ? (
                  <StatusPill label={formatDatum(vozilo.istek_registracije)} tone={rokStatus(vozilo.istek_registracije).tone} />
                ) : (
                  "—"
                )}
                <button className="btn secondary" onClick={handleProduziRegistraciju} title="Postavlja novi datum isteka na tačno godinu dana od trenutnog">
                  +1 godina
                </button>
              </strong>
            </div>
          </div>
          {vozilo.napomena && (
            <div className="napomena-box">
              <strong>Napomena:</strong> {vozilo.napomena}
            </div>
          )}
          <div style={{ marginTop: 16, fontSize: 13, color: "var(--ink-soft)" }}>
            Brisanje i izmena podataka o vozilu dostupni su u odeljku <Link href="/administracija" style={{ color: "var(--accent)", fontWeight: 600 }}>Administracija</Link>.
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="toolbar">
            <strong>Dokumenti</strong>
            <Link href={`/dokumenta?vozilo=${vozilo.id}`} className="btn secondary">+ Dodaj dokument</Link>
          </div>
          {dokumenta.length === 0 ? (
            <div className="empty-state">Nema unetih dokumenata za ovo vozilo.</div>
          ) : (
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
                  {dokumenta.map((d) => {
                    const s = rokStatus(d.datum_isteka);
                    return (
                      <tr key={d.id}>
                        <td data-label="Tip">{nazivTipaDokumenta(d.tip)}</td>
                        <td data-label="Broj" className="mono">{d.broj || "—"}</td>
                        <td data-label="Izdavalac">{d.izdavalac || "—"}</td>
                        <td data-label="Ističe" className="mono">{d.datum_isteka ? formatDatum(d.datum_isteka) : "—"}</td>
                        <td data-label="Status"><StatusPill label={s.label} tone={s.tone} /></td>
                        <td data-label="" className="cell-block">
                          {d.fajl_url ? (
                            <button className="btn secondary" onClick={() => handleOpenFile(d.fajl_url)}>
                              <FileText size={14} /> Otvori
                            </button>
                          ) : (
                            <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>bez fajla</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="toolbar">
            <strong>Održavanje</strong>
            <button className="btn secondary" onClick={() => setShowServisForm((s) => !s)}>
              {showServisForm ? "Otkaži" : "+ Dodaj servis"}
            </button>
          </div>

          {showServisForm && (
            <form className="admin-edit-box" onSubmit={handleSubmitServis} style={{ marginBottom: 16 }}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Vrsta servisa</label>
                  <select value={servisForm.tip_servisa} onChange={(e) => setServisForm({ ...servisForm, tip_servisa: e.target.value })}>
                    <option value="redovan">Redovan servis</option>
                    <option value="vanredni">Vanredni servis</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Datum servisa/popravke</label>
                  <input type="date" required value={servisForm.datum_servisa} onChange={(e) => setServisForm({ ...servisForm, datum_servisa: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Trenutna kilometraža</label>
                  <input type="number" value={servisForm.kilometraza} onChange={(e) => setServisForm({ ...servisForm, kilometraza: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Kilometraža za sledeći servis</label>
                  <input type="number" value={servisForm.kilometraza_sledeci_servis} onChange={(e) => setServisForm({ ...servisForm, kilometraza_sledeci_servis: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Majstor / servis</label>
                  <input value={servisForm.majstor_servis} onChange={(e) => setServisForm({ ...servisForm, majstor_servis: e.target.value })} />
                </div>
              </div>
              <div className="form-field" style={{ marginBottom: 14 }}>
                <label>Opis popravke</label>
                <textarea rows={2} value={servisForm.opis} onChange={(e) => setServisForm({ ...servisForm, opis: e.target.value })} />
              </div>
              <div className="form-field" style={{ marginBottom: 14 }}>
                <label>Zapaženi kvarovi</label>
                <textarea rows={2} value={servisForm.zapazeni_kvarovi} onChange={(e) => setServisForm({ ...servisForm, zapazeni_kvarovi: e.target.value })} />
              </div>
              {servisError && <div className="error-text" style={{ marginBottom: 12 }}>{servisError}</div>}
              <button className="btn" type="submit" disabled={savingServis}>
                {savingServis ? "Čuvanje..." : "Sačuvaj unos"}
              </button>
            </form>
          )}

          {odrzavanje.length === 0 ? (
            <div className="empty-state">Nema unetih servisa/popravki.</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Vrsta</th>
                    <th>Kilometraža</th>
                    <th>Sledeći servis (km)</th>
                    <th>Majstor/servis</th>
                    <th>Opis</th>
                    <th>Zapaženi kvarovi</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {odrzavanje.map((s) => (
                    <tr key={s.id}>
                      <td data-label="Datum" className="mono">{new Date(s.datum_servisa).toLocaleDateString("sr-RS")}</td>
                      <td data-label="Vrsta"><span className={`pill ${s.tip_servisa === "vanredni" ? "warn" : "ok"}`}>{s.tip_servisa === "vanredni" ? "Vanredni" : "Redovan"}</span></td>
                      <td data-label="Kilometraža" className="mono">{s.kilometraza ?? "—"}</td>
                      <td data-label="Sledeći servis (km)" className="mono">{s.kilometraza_sledeci_servis ?? "—"}</td>
                      <td data-label="Majstor/servis">{s.majstor_servis || "—"}</td>
                      <td data-label="Opis">{s.opis || "—"}</td>
                      <td data-label="Zapaženi kvarovi">{s.zapazeni_kvarovi || "—"}</td>
                      <td data-label="" className="cell-block">
                        <button className="btn secondary" onClick={() => handleDeleteServis(s)}>Obriši</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="toolbar">
            <strong>Putarine</strong>
            <Link href={`/putarine?vozilo=${vozilo.id}`} className="btn secondary">+ Dodaj putarinu</Link>
          </div>
          {putarine.length === 0 ? (
            <div className="empty-state">Nema unetih putarina za ovo vozilo.</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Zemlja</th>
                    <th>Broj taga</th>
                    <th>Napomena</th>
                  </tr>
                </thead>
                <tbody>
                  {putarine.map((p) => (
                    <tr key={p.id}>
                      <td data-label="Zemlja">{p.zemlja}</td>
                      <td data-label="Broj taga" className="mono">{p.broj_taga || "—"}</td>
                      <td data-label="Napomena">{p.napomena || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {racuni.length > 0 && (
          <div className="card">
            <div className="toolbar">
              <strong>Računi vezani za vozilo</strong>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Tip</th>
                    <th>Partner</th>
                    <th>Iznos</th>
                    <th>Rok</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {racuni.map((r) => (
                    <tr key={r.id}>
                      <td data-label="Tip">{r.tip === "izlazni" ? "Izlazni" : "Ulazni"}</td>
                      <td data-label="Partner">{r.partneri?.naziv || "—"}</td>
                      <td data-label="Iznos" className="mono">{Number(r.iznos).toLocaleString("sr-RS")} {r.valuta}</td>
                      <td data-label="Rok" className="mono">{r.rok_placanja ? new Date(r.rok_placanja).toLocaleDateString("sr-RS") : "—"}</td>
                      <td data-label="Status"><span className={`pill ${r.status === "placeno" ? "ok" : "warn"}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}