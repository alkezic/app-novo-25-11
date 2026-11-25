"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  FileText,
  Ticket,
  FileBarChart,
  Landmark,
  ShieldCheck,
  UserRound,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import InstallPrompt from "@/components/InstallPrompt";

const LINKS = [
  { href: "/dashboard", label: "Pregled", icon: LayoutDashboard },
  { href: "/vozila", label: "Vozila", icon: Car },
  { href: "/vozaci", label: "Vozači", icon: UserRound },
  { href: "/dokumenta", label: "Dokumenti", icon: FileText },
  { href: "/putarine", label: "Putarine", icon: Ticket },
  { href: "/izvestaji", label: "Izveštaji", icon: FileBarChart },
  { href: "/finansije", label: "Finansije", icon: Landmark },
];

const ADMIN_LINK = { href: "/administracija", label: "Administracija", icon: ShieldCheck };
const SETTINGS_LINK = { href: "/podesavanja", label: "Podešavanja", icon: Settings };

export default function Sidebar({ email, nazivFirme, open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="brand-mark" />
          {nazivFirme || "Vozni park"}
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Zatvori meni">
          <X size={20} />
        </button>
      </div>

      {LINKS.map((link) => {
        const Icon = link.icon;
        const active = pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} className={active ? "active" : ""} onClick={onClose}>
            <Icon size={17} strokeWidth={2} />
            {link.label}
          </Link>
        );
      })}

      <ThemeToggle />

      <div className="sidebar-divider" />
      <Link
        href={ADMIN_LINK.href}
        className={pathname.startsWith(ADMIN_LINK.href) ? "active" : ""}
        onClick={onClose}
      >
        <ShieldCheck size={17} strokeWidth={2} />
        {ADMIN_LINK.label}
      </Link>
      <Link
        href={SETTINGS_LINK.href}
        className={pathname.startsWith(SETTINGS_LINK.href) ? "active" : ""}
        onClick={onClose}
      >
        <Settings size={17} strokeWidth={2} />
        {SETTINGS_LINK.label}
      </Link>

      <div className="sidebar-footer">
        <InstallPrompt />
        {email && <div className="sidebar-email">{email}</div>}
        <button onClick={handleLogout}>
          <LogOut size={15} />
          Odjavi se
        </button>
      </div>
    </aside>
  );
}