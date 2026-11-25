"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sigurnoImeFajla } from "@/lib/sigurnoImeFajla";
import { zabeleziIzmenu } from "@/lib/log";

export default function ReplaceFileButton({ docId, oldFajlUrl, opisZaLog, onChanged }) {
  const supabase = createClient();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const putanja = `${Date.now()}-${sigurnoImeFajla(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("dokumenti").upload(putanja, file);

    if (uploadError) {
      alert("Greška pri otpremanju fajla: " + uploadError.message);
      setUploading(false);
      return;
    }

    await supabase.from("dokumenta").update({ fajl_url: putanja }).eq("id", docId);

    if (oldFajlUrl) {
      try {
        await supabase.storage.from("dokumenti").remove([oldFajlUrl]);
      } catch {
        // stari fajl se možda ne može obrisati - nije kritično
      }
    }

    await zabeleziIzmenu(supabase, {
      opis: opisZaLog || "Zamenjen fajl dokumenta",
      tabela: "dokumenta",
      akcija: oldFajlUrl ? "zamena fajla" : "otpremanje fajla",
    });

    setUploading(false);
    e.target.value = "";
    onChanged?.();
  }

  return (
    <>
      <button
        type="button"
        className="btn secondary"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Otpremanje..." : oldFajlUrl ? "Zameni" : "Otpremi"}
      </button>
      <input ref={inputRef} type="file" style={{ display: "none" }} onChange={handleChange} />
    </>
  );
}
