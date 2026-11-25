"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sigurnoImeFajla } from "@/lib/sigurnoImeFajla";
import { zabeleziIzmenu } from "@/lib/log";
import { nazivTipaDokumenta } from "@/lib/tipDokumenta";
import { rokStatus } from "@/components/StatusPill";
import { useToast } from "@/components/Toast";

export default function DocChip({ vozioId, vozacId, tip, label, doc, onChanged, zahtevaDatum, voziloOznaka, vozacIme }) {
  const supabase = createClient();
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showDatumPitanje, setShowDatumPitanje] = useState(false);
  const [datumIzdavanja, setDatumIzdavanja] = useState("");
  const [greska, setGreska] = useState("");

  async function handleOpen() {
    const { data } = await supabase.storage.from("dokumenti").createSignedUrl(doc.fajl_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Fajl nije moguće otvoriti");
  }

  function handleClick(e) {
    e.preventDefault();
    setGreska("");
    if (doc?.fajl_url) {
      handleOpen();
    } else if (zahtevaDatum) {
      setShowDatumPitanje(true);
    } else {
      inputRef.current?.click();
    }
  }

  function handlePotvrdiDatum() {
    if (!datumIzdavanja) {
      setGreska("Unesi datum pre otpremanja fajla.");
      return;
    }
    setShowDatumPitanje(false);
    inputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setGreska("");

    const putanja = `${Date.now()}-${sigurnoImeFajla(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("dokumenti").upload(putanja, file);

    if (uploadError) {
      setGreska("Greška: " + uploadError.message);
      toast.error("Greška pri otpremanju: " + uploadError.message);
      setUploading(false);
      e.target.value = "";
      return;
    }

    const dopunaPolja = zahtevaDatum && datumIzdavanja ? { datum_izdavanja: datumIzdavanja } : {};

    if (doc?.id) {
      const { error: updateError } = await supabase.from("dokumenta").update({ fajl_url: putanja, ...dopunaPolja }).eq("id", doc.id);
      if (updateError) {
        toast.error("Greška pri čuvanju: " + updateError.message);
        setUploading(false);
        e.target.value = "";
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("dokumenta").insert({ vozilo_id: vozioId || null, vozac_id: vozacId || null, tip, fajl_url: putanja, ...dopunaPolja });
      if (insertError) {
        toast.error("Greška pri čuvanju: " + insertError.message);
        setUploading(false);
        e.target.value = "";
        return;
      }
    }

    const naKoga = voziloOznaka ? ` za vozilo ${voziloOznaka}` : vozacIme ? ` za vozača ${vozacIme}` : "";

    await zabeleziIzmenu(supabase, {
      opis: `Otpremljen fajl (${nazivTipaDokumenta(tip)})${naKoga}`,
      tabela: "dokumenta",
      akcija: doc?.id ? "zamena fajla" : "otpremanje fajla",
    });

    toast.success(`Fajl je otpremljen (${label})`);
    setUploading(false);
    setDatumIzdavanja("");
    e.target.value = "";
    onChanged?.();
  }

  const hasFile = !!doc?.fajl_url;

  const statusZaBoju = hasFile
    ? doc?.datum_isteka
      ? rokStatus(doc.datum_isteka).tone
      : "ok"
    : "missing";

  const klasa = hasFile ? `doc-chip has-file ${statusZaBoju}` : "doc-chip missing";

  return (
    <div className="doc-chip-wrap">
      <button
        type="button"
        className={klasa}
        onClick={handleClick}
        disabled={uploading}
        title={
          hasFile
            ? `Preuzmi — ${label}${doc?.datum_isteka ? ` (ističe ${new Date(doc.datum_isteka).toLocaleDateString("sr-RS")})` : ""}`
            : `Nema fajla — klikni da otpremiš ${label}`
        }
      >
        {uploading ? "..." : label}
      </button>
      <input ref={inputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />

      {greska && !showDatumPitanje && (
        <div className="error-text" style={{ fontSize: 10, marginTop: 2 }}>{greska}</div>
      )}

      {showDatumPitanje && (
        <div className="doc-chip-popover">
          <label>Datum izdavanja</label>
          <input type="date" value={datumIzdavanja} onChange={(e) => setDatumIzdavanja(e.target.value)} autoFocus />
          {greska && <div className="error-text">{greska}</div>}
          <div className="doc-chip-popover-dugmad">
            <button type="button" className="btn secondary" onClick={() => { setShowDatumPitanje(false); setGreska(""); }}>Otkaži</button>
            <button type="button" className="btn" onClick={handlePotvrdiDatum}>Dalje</button>
          </div>
        </div>
      )}
    </div>
  );
}