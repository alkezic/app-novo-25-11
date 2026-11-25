"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { zabeleziIzmenu } from "@/lib/log";
import { formatIznos, statusRacuna } from "@/lib/finansije";

export default function RacunDetaljiPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [racun, setRacun] = useState(null);
  const [raspodele, setRaspodele] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    const { data: r } = await supabase.from("v_racuni_stanje").select("*, partneri(naziv), vozila(marka_tip, registracija)").eq("id", id).single();

    if (!r) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const { data: rasp } = await supabase
      .from("raspodele_uplata")
      .select("*, placanja(datum, iznos, valuta, referenca, napomena)")
      .eq("racun_id", id)
      .order("created_at", { ascending: false });

    setRacun(r);
    setRaspodele(rasp || []);
    setLoading(false);
  }

  async function handleOpenFile() {
    const { data } = await supabase.storage.from("dokumenti").createSignedUrl(racun.fajl_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function handleStorniraj() {
    if (!confirm("Stornirati ovaj račun? Zapis ostaje u istoriji, ali se više ne računa u otvorena potraživanja/obaveze.")) return;
    await supabase.from("racuni").update({ storniran: true }).eq("id", id);
    await zabeleziIzmenu(supabase, {
      opis: `Storniran račun ${racun.broj_racuna || ""}`,
      tabela: "racuni",
      akcija: "izmena",
    });
    load();
  }

  async function handleUkloniRaspodelu(r) {
    if (!confirm("Ukloniti ovu raspodelu? Iznos se vraća uplati kao neraspoređen.")) return;
    await supabase.from("raspodele_uplata").delete().eq("id", r.id);
    await zabeleziIzmenu(supabase, { opis: `Uklonjena raspodela sa računa ${racun.broj_racuna || ""}`, tabela: "raspodele_uplata", akcija: "brisanje" });
    load();
  }

  if (loading) return <div className="page-subtitle">Učitavanje...</div>;

  if (notFound || !racun) {
    return (
      <div>
        <Link href="/finansije" className="back-link"><ArrowLeft size={15} /> Nazad na Finansije</Link>
        <div className="empty-state">Račun nije pronađen.</div>
      </div>
    );
  }

  const s = statusRacuna(racun.status);
  const nazadNa = racun.tip === "izlazni" ? "/finansije/izdati" : "/finansije/primljeni";

  return (
    <div>
      <Link href={nazadNa} className="back-link"><ArrowLeft size={15} /> Nazad na {racun.tip === "izlazni" ? "izdate" : "primljene"} račune</Link>

      <div className="detail-header">
        <div>
          <h1 className="page-title mono">{racun.broj_racuna || "bez broja"}</h1>
        </div>
        <span className={`pill ${s.tone}`}>{s.label}</span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="info-grid">
          <div className="info-item"><span>{racun.tip === "izlazni" ? "Klijent" : "Dobavljač"}</span><strong>{racun.partneri?.naziv || "—"}</strong></div>
          <div className="info-item"><span>Datum računa</span><strong className="mono">{new Date(racun.datum_izdavanja).toLocaleDateString("sr-RS")}</strong></div>
          <div className="info-item"><span>Valuta plaćanja</span><strong className="mono">{racun.datum_valute ? new Date(racun.datum_valute).toLocaleDateString("sr-RS") : "—"}</strong></div>
          <div className="info-item"><span>Iznos</span><strong className="mono">{formatIznos(racun.iznos, racun.valuta)}</strong></div>
          <div className="info-item"><span>Plaćeno</span><strong className="mono">{formatIznos(racun.placeno, racun.valuta)}</strong></div>
          <div className="info-item"><span>Preostalo</span><strong className="mono">{formatIznos(racun.preostalo, racun.valuta)}</strong></div>
          {racun.vozila && <div className="info-item"><span>Vozilo</span><strong>{racun.vozila.marka_tip} · {racun.vozila.registracija}</strong></div>}
          {racun.pdv_stopa != null && <div className="info-item"><span>PDV stopa</span><strong>{racun.pdv_stopa}%</strong></div>}
        </div>
        {racun.opis && (
          <div className="napomena-box"><strong>Opis:</strong> {racun.opis}</div>
        )}
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          {racun.fajl_url && (
            <button className="btn secondary" onClick={handleOpenFile}><FileText size={14} /> Otvori fajl</button>
          )}
          {!racun.storniran && (
            <button className="btn secondary" onClick={handleStorniraj}>Storniraj račun</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <strong>Uplate povezane sa računom</strong>
        </div>
        {raspodele.length === 0 ? (
          <div className="empty-state">Nema uplata raspoređenih na ovaj račun.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Raspoređeno</th>
                  <th>Referenca</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {raspodele.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Datum" className="mono">{r.placanja ? new Date(r.placanja.datum).toLocaleDateString("sr-RS") : "—"}</td>
                    <td data-label="Raspoređeno" className="mono">{formatIznos(r.iznos, racun.valuta)}</td>
                    <td data-label="Referenca">{r.placanja?.referenca || "—"}</td>
                    <td data-label="" className="cell-block">
                      <button className="btn secondary" onClick={() => handleUkloniRaspodelu(r)}>Ukloni</button>
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
