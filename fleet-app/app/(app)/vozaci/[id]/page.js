"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import StatusPill, { rokStatus } from "@/components/StatusPill";
import { nazivTipaDokumenta } from "@/lib/tipDokumenta";

export default function VozacDetailPage() {
  const { id } = useParams();
  const supabase = createClient();

  const [vozac, setVozac] = useState(null);
  const [dokumenta, setDokumenta] = useState([]);
  const [vozila, setVozila] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    const { data: v } = await supabase.from("vozaci").select("*").eq("id", id).single();

    if (!v) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const [{ data: d }, { data: vz }] = await Promise.all([
      supabase.from("dokumenta").select("*").eq("vozac_id", id).order("datum_isteka", { ascending: true }),
      supabase.from("vozila").select("id, registracija, marka_tip").eq("vozac_id", id),
    ]);

    setVozac(v);
    setDokumenta(d || []);
    setVozila(vz || []);
    setLoading(false);
  }

  async function handleOpenFile(fajl_url) {
    const { data } = await supabase.storage.from("dokumenti").createSignedUrl(fajl_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  if (loading) return <div className="page-subtitle">Učitavanje...</div>;

  if (notFound || !vozac) {
    return (
      <div>
        <Link href="/vozaci" className="back-link"><ArrowLeft size={15} /> Nazad na vozače</Link>
        <div className="empty-state">Vozač nije pronađen.</div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/vozaci" className="back-link"><ArrowLeft size={15} /> Nazad na vozače</Link>

      <div className="detail-header">
        <div>
          <h1 className="page-title">{vozac.ime_prezime}</h1>
        </div>
        <span className={`pill ${vozac.aktivan ? "ok" : "neutral"}`}>{vozac.aktivan ? "Aktivan" : "Neaktivan"}</span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="info-grid">
          <div className="info-item"><span>Telefon</span><strong className="mono">{vozac.telefon || "—"}</strong></div>
          <div className="info-item"><span>Email</span><strong>{vozac.email || "—"}</strong></div>
          <div className="info-item"><span>Broj vozačke dozvole</span><strong className="mono">{vozac.broj_vozacke || "—"}</strong></div>
          <div className="info-item"><span>Kategorija</span><strong>{vozac.kategorija || "—"}</strong></div>
        </div>
        {vozac.napomena && (
          <div className="napomena-box">
            <strong>Napomena:</strong> {vozac.napomena}
          </div>
        )}
        <div style={{ marginTop: 16, fontSize: 13, color: "var(--ink-soft)" }}>
          Brisanje i izmena podataka o vozaču dostupni su u odeljku <Link href="/administracija" style={{ color: "var(--accent)", fontWeight: 600 }}>Administracija</Link>.
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="toolbar">
          <strong>Dokumenti</strong>
          <Link href={`/dokumenta?vozac=${vozac.id}`} className="btn secondary">+ Dodaj dokument</Link>
        </div>
        {dokumenta.length === 0 ? (
          <div className="empty-state">Nema unetih dokumenata za ovog vozača.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tip</th>
                  <th>Broj</th>
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
                      <td data-label="Ističe" className="mono">{d.datum_isteka ? new Date(d.datum_isteka).toLocaleDateString("sr-RS") : "—"}</td>
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

      <div className="card">
        <div className="toolbar">
          <strong>Dodeljena vozila</strong>
        </div>
        {vozila.length === 0 ? (
          <div className="empty-state">Ovom vozaču trenutno nije formalno dodeljeno nijedno vozilo (podesi u Administraciji).</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Registracija</th>
                  <th>Marka i tip</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vozila.map((v) => (
                  <tr key={v.id}>
                    <td data-label="Registracija" className="mono">{v.registracija}</td>
                    <td data-label="Marka i tip">{v.marka_tip}</td>
                    <td data-label="" className="cell-block">
                      <Link href={`/vozila/${v.id}`} className="btn secondary">Pregled vozila</Link>
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
