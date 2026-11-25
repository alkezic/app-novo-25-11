"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function GlobalSearch() {
  const supabase = createClient();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [vozila, setVozila] = useState([]);
  const [vozaci, setVozaci] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setVozila([]);
      setVozaci([]);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      const [{ data: v }, { data: vc }] = await Promise.all([
        supabase
          .from("vozila")
          .select("id, registracija, marka_tip, vin")
          .or(`registracija.ilike.%${q}%,vin.ilike.%${q}%,marka_tip.ilike.%${q}%`)
          .limit(6),
        supabase
          .from("vozaci")
          .select("id, ime_prezime, telefon, broj_vozacke")
          .or(`ime_prezime.ilike.%${q}%,telefon.ilike.%${q}%,broj_vozacke.ilike.%${q}%`)
          .limit(4),
      ]);
      setVozila(v || []);
      setVozaci(vc || []);
      setLoading(false);
      setOpen(true);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  function goTo(url) {
    setOpen(false);
    setQuery("");
    router.push(url);
  }

  const ukupno = vozila.length + vozaci.length;

  return (
    <div className="global-search" ref={boxRef}>
      <Search size={16} className="global-search-icon" />
      <input
        placeholder="Brza pretraga — registracija, vozač, VIN, telefon..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
      />
      {open && (
        <div className="global-search-dropdown">
          {loading && <div className="global-search-item muted">Pretraga...</div>}
          {!loading && ukupno === 0 && query.trim().length >= 2 && (
            <div className="global-search-item muted">Nema rezultata.</div>
          )}

          {!loading && vozila.length > 0 && (
            <>
              <div className="global-search-section">Vozila</div>
              {vozila.map((v) => (
                <div key={v.id} className="global-search-item" onClick={() => goTo(`/vozila/${v.id}`)}>
                  <span className="mono">{v.registracija}</span>
                  <span className="global-search-sub">{v.marka_tip}{v.vin ? ` · ${v.vin}` : ""}</span>
                </div>
              ))}
            </>
          )}

          {!loading && vozaci.length > 0 && (
            <>
              <div className="global-search-section">Vozači</div>
              {vozaci.map((v) => (
                <div key={v.id} className="global-search-item" onClick={() => goTo(`/vozaci/${v.id}`)}>
                  <span>{v.ime_prezime}</span>
                  <span className="global-search-sub">
                    {v.telefon || v.broj_vozacke || ""}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}