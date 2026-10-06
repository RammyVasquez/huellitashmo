"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS: [string, string][] = [
  ["/animales", "Adopta"],
  ["/animales?apadrinar=1", "Apadrina"],
  ["/donar", "Dona"],
  ["/refugios", "Refugios"],
  ["/rescate", "Rescate"],
  ["/reportes", "Perdidos y encontrados"],
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button className="nav-toggle" aria-expanded={open} aria-controls="menu-principal" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen((o) => !o)}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 5h14M3 10h14M3 15h14" />}
        </svg>
        <span className="nav-label">{open ? "Cerrar" : "Menú"}</span>
      </button>
      <nav id="menu-principal" aria-label="Principal" className={`nav-links${open ? " open" : ""}`}>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} aria-current={!href.includes("?") && pathname === href ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <Link href="/primeros-auxilios" className="emerg" aria-label="Emergencia con tu mascota: primeros auxilios">
        <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M10 3v14M3 10h14" /></svg>
        Emergencia
      </Link>
    </>
  );
}
