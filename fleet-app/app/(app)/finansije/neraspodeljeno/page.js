"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatIznos } from "@/lib/finansije";
import RaspodelaUplate from "@/components/RaspodelaUplate";

export default function NeraspodeljenoPage() {
  const supabase = createClient();
  const [placanja, setPlacanja] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pregled, setPregled] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("v_placanja_stanje")
      .select("*, partneri(naziv)")
      .eq("storniran", false)
      .gt("neraspodeljeno", 0)
      .order("datum", { ascending: false });
    setPlacanja(data || []);
    setLoading(false);
  }

  return (
    <div>
      <h1 className="page-title">Neraspoređene uplate</h1>
      <p className="page-subtitle">Sve uplate i isplate koje nisu u potpunosti raspoređene na račune.</p>

      {pregled && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="toolbar">
            <strong>{pregled.placanje.tip === "primljena" ? "Uplata" : "Isplata"} od {formatIznos(pregled.placanje.iznos, pregled.placanje.valuta)}</strong>
            <button className="btn secondary" onClick={() => setPregled(null)}>Zatvori</button>
          </div>
          <RaspodelaUplate
            key={pregled.placanje.id}
            placanje={pregled.placanje}
            tipRacuna={pregled.placanje.tip === "primljena" ? "izlazni" : "ulazni"}
            predlogRedovi={[]}
            onChanged={load}
          />
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state">Učitavanje...</div>
        ) : placanja.length === 0 ? (
          <div className="empty-state">Sve uplate i isplate su u potpunosti raspoređene.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Tip</th>
                  <th>Partner</th>
                  <th>Iznos</th>
                  <th>Raspoređeno</th>
                  <th>Preostalo</th>
                  <th>Napomena</th>
                  <th className="col-sticky-right"></th>
                </tr>
              </thead>
              <tbody>
                {placanja.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Datum" className="mono">{new Date(p.datum).toLocaleDateString("sr-RS")}</td>
                    <td data-label="Tip">{p.tip === "primljena" ? "Uplata" : "Isplata"}</td>
                    <td data-label="Partner">{p.partneri?.naziv || "—"}</td>
                    <td data-label="Iznos" className="mono">{formatIznos(p.iznos, p.valuta)}</td>
                    <td data-label="Raspoređeno" className="mono">{formatIznos(p.rasporedjeno, p.valuta)}</td>
                    <td data-label="Preostalo"><span className="pill warn">{formatIznos(p.neraspodeljeno, p.valuta)}</span></td>
                    <td data-label="Napomena">{p.napomena || "—"}</td>
                    <td data-label="" className="cell-block col-sticky-right">
                      <button className="btn secondary" onClick={() => setPregled({ placanje: p })}>Rasporedi</button>
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
