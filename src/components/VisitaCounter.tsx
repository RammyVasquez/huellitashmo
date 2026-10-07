"use client";
import { useEffect } from "react";

const ORIGENES: [RegExp, string][] = [
  [/(^|\.)(facebook|fb)\.com$|(^|\.)fb\.me$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)google\./, "google"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"],
  [/(^|\.)(t\.me|telegram\.org)$/, "telegram"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
];

// Cuenta una visita por sesión del navegador y la clasifica por origen (?ref=... o sitio de procedencia).
// No usa cookies, no guarda IP ni identifica personas: solo suma uno al contador del día.
export default function VisitaCounter() {
  useEffect(() => {
    try {
      if (location.pathname.startsWith("/admin")) return;
      const params = new URLSearchParams(location.search);
      if (params.get("nocontar") === "1") localStorage.setItem("hh_no_contar", "1"); // para que el equipo no se cuente a sí mismo
      if (localStorage.getItem("hh_no_contar") || sessionStorage.getItem("hh_visita")) return;
      sessionStorage.setItem("hh_visita", "1");

      const ref = (params.get("ref") ?? "").toLowerCase();
      let fuente = /^[a-z0-9_-]{1,30}$/.test(ref) ? ref : "";
      if (!fuente) {
        if (!document.referrer) fuente = "directo";
        else {
          const host = new URL(document.referrer).hostname.toLowerCase();
          fuente = host === location.hostname ? "directo" : ORIGENES.find(([re]) => re.test(host))?.[1] ?? "otro_sitio";
        }
      }
      fetch("/api/visita", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fuente }), keepalive: true }).catch(() => {});
    } catch { /* sin almacenamiento: no se cuenta */ }
  }, []);
  return null;
}
