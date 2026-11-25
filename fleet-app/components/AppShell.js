"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";

export default function AppShell({ email, nazivFirme, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="shell">
      <Sidebar email={email} nazivFirme={nazivFirme} open={open} onClose={() => setOpen(false)} />
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <div className="content-area">
        <header className="topbar">
          <button className="hamburger" onClick={() => setOpen(true)} aria-label="Otvori meni">
            <Menu size={20} />
          </button>
          <GlobalSearch />
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
