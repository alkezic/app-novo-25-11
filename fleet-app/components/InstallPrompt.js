"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function InstallPrompt() {
  const [dogadjaj, setDogadjaj] = useState(null);
  const [instalirano, setInstalirano] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setInstalirano(true);
      return;
    }

    function handler(e) {
      e.preventDefault();
      setDogadjaj(e);
    }

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalirano(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (instalirano || !dogadjaj) return null;

  async function handleInstall() {
    dogadjaj.prompt();
    await dogadjaj.userChoice;
    setDogadjaj(null);
  }

  return (
    <button className="install-prompt-btn" onClick={handleInstall}>
      <Download size={15} />
      Instaliraj aplikaciju
    </button>
  );
}
