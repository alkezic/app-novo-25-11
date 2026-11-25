"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [tema, setTema] = useState("dark");

  useEffect(() => {
    const sacuvano = window.localStorage.getItem("tema");
    const trenutno = document.documentElement.classList.contains("light") ? "light" : "dark";
    setTema(sacuvano || trenutno);
  }, []);

  function primeni(nova) {
    setTema(nova);
    window.localStorage.setItem("tema", nova);
    document.documentElement.classList.toggle("light", nova === "light");
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Izgled interfejsa">
      <button
        type="button"
        className={tema === "dark" ? "active" : ""}
        onClick={() => primeni("dark")}
        title="Tamni izgled"
      >
        <Moon size={14} /> Tamno
      </button>
      <button
        type="button"
        className={tema === "light" ? "active" : ""}
        onClick={() => primeni("light")}
        title="Svetli izgled"
      >
        <Sun size={14} /> Svetlo
      </button>
    </div>
  );
}
