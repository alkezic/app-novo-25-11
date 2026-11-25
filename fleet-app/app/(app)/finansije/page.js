"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatIznos, statusRacuna } from "@/lib/finansije";

export default function FinansijePregledPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [racuni, setRacuni] = useState([]);
  const [placanja, setPlacanja] = useState([]);
  const [neraspodeljeno, setNeraspodeljeno] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: r }, { data: p }, { data: n }] = await Promise.all([
      supabase.from("v_racuni_stanje").select("*, partneri(naziv)").order("datum_valute", { ascending: true }),
      supabase.from("placanja").select("*").eq("storniran", false),
      supabase.from("v_placanja_stanje").select("*, partneri(naziv)").gt("neraspodeljeno", 0).eq("storniran", false),
    ]);
    setRacuni(r || []);
    setPlacanja(p || []);
    setNeraspodeljeno(n || []);
    setLoading(false);
  }

  if (loading) return <div className="page-subtitle">Učitavanje...</div>;

  const danas = new Date().toISOString().slice(0, 10);

  const otvoreniIzlazni = racuni.filter((r) => r.tip === "izlazni" && r.status !== "placeno" && r.status !== "storniran");
  const otvoreniUlazni = racuni.filter((r) => r.tip === "ulazni" && r.status !== "placeno" && r.status !== "storniran");

  const potrazivanja = otvoreniIzlazni.reduce((s, r) => s + Number(r.preostalo), 0);
  const obaveze = otvoreniUlazni.reduce((s, r) => s + Number(r.preostalo), 0);
  const dospelaPotrazivanja = otvoreniIzlazni.filter((r) => r.dana_kasnjenja != null).reduce((s, r) => s + Number(r.preostalo), 0);
  const dospeleObaveze = otvoreniUlazni.filter((r) => r.dana_kasnjenja != null).reduce((s, r) => s + Number(r.preostalo), 0);

  const uplateDanas = placanja.filter((p) => p.tip === "primljena" && p.datum === danas).reduce((s, p) => s + Number(p.iznos), 0);
  const isplateDanas = placanja.filter((p) => p.tip === "poslata" && p.datum === danas).reduce((s, p) => s + Number(p.iznos), 0);
  const ukupnoNeraspodeljeno = neraspodeljeno.reduce((s, p) => s + Number(p.neraspodeljeno), 0);

  return (
    <div>
      <h1 className="page-title">Finansije</h1>
      <p className="page-subtitle">Pregled potraživanja, obaveza i uplata.</p>

      <div className="grid-stats">
        <div className="stat">
          <div className="stat-label">Potraživanja (neplaćeni izlazni)</div>
          <div className="stat-value mono">{formatIznos(potrazivanja)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Obaveze (neplaćeni ulazni)</div>
          <div className="stat-value mono">{formatIznos(obaveze)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Uplate danas</div>
          <div className="stat-value mono">{formatIznos(uplateDanas)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Isplate danas</div>
          <div className="stat-value mono">{formatIznos(isplateDanas)}</div>
        </div>
        <div className={`stat ${ukupnoNeraspodeljeno ? "warn" : ""}`}>
          <div className="stat-label">Neraspoređene uplate</div>
          <div className="stat-value mono">{formatIznos(ukupnoNeraspodeljeno)}</div>
        </div>
        <div className={`stat ${dospeleObaveze ? "danger" : ""}`}>
          <div className="stat-label">Dospele obaveze</div>
          <div className="stat-value mono">{formatIznos(dospeleObaveze)}</div>
        </div>
        <div className={`stat ${dospelaPotrazivanja ? "danger" : ""}`}>
          <div className="stat-label">Potraživanja kojima je prošla valuta</div>
          <div className="stat-value mono">{formatIznos(dospelaPotrazivanja)}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="toolbar">
          <strong>Šta treba da naplatimo</strong>
          <Link href="/finansije/izdati" className="btn secondary">Svi izdati računi</Link>
        </div>
        {otvoreniIzlazni.length === 0 ? (
          <div className="empty-state">Nema otvorenih potraživanja.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Klijent</th>
                  <th>Račun</th>
                  <th>Valuta plaćanja</th>
                  <th>Preostalo</th>
                  <th>Kašnjenje</th>
                </tr>
              </thead>
              <tbody>
                {otvoreniIzlazni.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Klijent">{r.partneri?.naziv || "—"}</td>
                    <td data-label="Račun" className="mono">
                      <Link href={`/finansije/racuni/${r.id}`}>{r.broj_racuna || "—"}</Link>
                    </td>
                    <td data-label="Valuta plaćanja" className="mono">{r.datum_valute ? new Date(r.datum_valute).toLocaleDateString("sr-RS") : "—"}</td>
                    <td data-label="Preostalo" className="mono">{formatIznos(r.preostalo, r.valuta)}</td>
                    <td data-label="Kašnjenje">
                      {r.dana_kasnjenja != null ? <span className="pill danger">{r.dana_kasnjenja}d</span> : <span className="pill ok">na vreme</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="toolbar">
          <strong>Šta mi moramo da platimo</strong>
          <Link href="/finansije/primljeni" className="btn secondary">Svi primljeni računi</Link>
        </div>
        {otvoreniUlazni.length === 0 ? (
          <div className="empty-state">Nema otvorenih obaveza.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Dobavljač</th>
                  <th>Račun</th>
                  <th>Valuta plaćanja</th>
                  <th>Preostalo</th>
                  <th>Kašnjenje</th>
                </tr>
              </thead>
              <tbody>
                {otvoreniUlazni.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Dobavljač">{r.partneri?.naziv || "—"}</td>
                    <td data-label="Račun" className="mono">
                      <Link href={`/finansije/racuni/${r.id}`}>{r.broj_racuna || "—"}</Link>
                    </td>
                    <td data-label="Valuta plaćanja" className="mono">{r.datum_valute ? new Date(r.datum_valute).toLocaleDateString("sr-RS") : "—"}</td>
                    <td data-label="Preostalo" className="mono">{formatIznos(r.preostalo, r.valuta)}</td>
                    <td data-label="Kašnjenje">
                      {r.dana_kasnjenja != null ? <span className="pill danger">{r.dana_kasnjenja}d</span> : <span className="pill ok">na vreme</span>}
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
