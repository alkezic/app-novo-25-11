"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // instalacija aplikacije i dalje radi i bez servisnog radnika,
        // samo bez offline rezerve - nije kritično ako ovo ne uspe
      });
    }
  }, []);

  return null;
}
