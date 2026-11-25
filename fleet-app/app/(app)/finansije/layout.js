"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABOVI = [
  { href: "/finansije", label: "Pregled", exact: true },
  { href: "/finansije/izdati", label: "Izdati računi" },
  { href: "/finansije/primljeni", label: "Primljeni računi" },
  { href: "/finansije/uplate", label: "Uplate nama" },
  { href: "/finansije/isplate", label: "Uplate dobavljačima" },
  { href: "/finansije/neraspodeljeno", label: "Neraspoređeno" },
  { href: "/finansije/banke", label: "Banke" },
];

export default function FinansijeLayout({ children }) {
  const pathname = usePathname();

  return (
    <div>
      <div className="finansije-tabs">
        {TABOVI.map((t) => {
          const aktivan = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={`finansije-tab ${aktivan ? "active" : ""}`}>
              {t.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
