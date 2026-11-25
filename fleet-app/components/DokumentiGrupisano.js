"use client";

import { Fragment } from "react";
import { nazivTipaDokumenta } from "@/lib/tipDokumenta";
import { formatDatum } from "@/lib/datum";
import ReplaceFileButton from "@/components/ReplaceFileButton";

export default function DokumentiGrupisano({ grupe, naslovKolone, praznoTekst, onOpen, onDelete, onChanged }) {
  if (grupe.length === 0) {
    return <div className="empty-state">{praznoTekst}</div>;
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
                      {d.fajl_url && <button className="btn secondary" onClick={() => onOpen(d.fajl_url)}>Otvori</button>}
                      <ReplaceFileButton
                        docId={d.id}
                        oldFajlUrl={d.fajl_url}
                        opisZaLog={`Zamenjen fajl dokumenta (${nazivTipaDokumenta(d.tip)})${d.vozila ? " za vozilo " + d.vozila.registracija : ""}${d.vozaci ? " za vozača " + d.vozaci.ime_prezime : ""}`}
                        onChanged={onChanged}
                      />
                    </div>
                  </td>
                  <td data-label="" className="cell-block">
                    <button className="btn danger" onClick={() => onDelete(d)}>Obriši</button>
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
