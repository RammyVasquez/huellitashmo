"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { coincide } from "@/lib/buscar";
import { errTexto, fechaCorta } from "@/lib/util";
import MatchPanel from "./MatchPanel";
import type { AdminReport } from "@/lib/types";

const ESTADOS = ["pendiente", "activo", "reunificado", "cerrado"] as const;
type Estado = (typeof ESTADOS)[number];

export default function ReportsTab() {
  const [items, setItems] = useState<AdminReport[]>([]);
  const [filtro, setFiltro] = useState<Estado>("pendiente");
  const [msg, setMsg] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  async function load() {
    const { data, error } = await supabase.from("reports").select("id, kind, species, description, photo_url, photos, zone, lat, lng, contact_whatsapp, status, created_at").order("created_at", { ascending: false }).limit(300);
    if (error) setMsg(`No se pudieron cargar: ${errTexto(error)}`);
    setItems((data ?? []) as AdminReport[]);
  }
  useEffect(() => { load(); }, []);

  async function cambiar(id: string, status: Estado) {
    setMsg("");
    const { error } = await supabase
      .from("reports")
      .update({ status, resolved_at: status === "reunificado" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) setMsg(`No se pudo actualizar: ${errTexto(error)}`);
    else load();
  }

  const lista = items.filter((r) => r.status === filtro && coincide(busqueda, `${r.kind} ${r.species} ${r.zone ?? ""} ${r.description}`));
  const cuenta = (e: Estado) => items.filter((r) => r.status === e).length;

  const acciones: Record<Estado, [string, Estado, boolean][]> = {
    pendiente: [["Publicar", "activo", true], ["Descartar", "cerrado", false]],
    activo: [["Marcar reunificado", "reunificado", true], ["Cerrar", "cerrado", false]],
    reunificado: [["Reabrir", "activo", false]],
    cerrado: [["Volver a publicar", "activo", false]],
  };

  return (
    <>
      <label className="buscador">Buscar en los reportes
        <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. gris collar rosa, Portales" />
      </label>
      <div className="chips">
        {ESTADOS.map((e) => (
          <a key={e} href="#" aria-current={filtro === e} onClick={(ev) => { ev.preventDefault(); setFiltro(e); }}>
            {e} ({cuenta(e)})
          </a>
        ))}
      </div>
      {msg && <p className="error" role="alert">{msg}</p>}
      {lista.length === 0 && <div className="empty">No hay reportes en “{filtro}”.</div>}
      {lista.map((r) => (
        <div key={r.id}>
        <div className="admin-row">
          <div className="thumbs">
            {(r.photos?.length ? r.photos : r.photo_url ? [r.photo_url] : []).slice(0, 5).map((u) => (
              <a key={u} href={u} target="_blank" rel="noopener noreferrer"><img className="thumb" src={u} alt="Foto del reporte" /></a>
            ))}
            {!r.photos?.length && !r.photo_url && <div className="thumb" />}
          </div>
          <div className="grow">
            <span className={`tag ${r.kind}`}>{r.kind}</span><span className="tag">{r.species}</span>
            <span className="muted"> {r.zone} · {fechaCorta(r.created_at)}</span>
            <p style={{ margin: ".3rem 0" }}>{r.description}</p>
            <a href={`https://wa.me/${r.contact_whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp de quien reportó</a>
            {" · "}
            {r.lat != null && r.lng != null
              ? <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noopener noreferrer">Ver ubicación exacta</a>
              : <span className="muted">Sin ubicación en el mapa</span>}
            {r.status === "activo" && (
              <>
                {" · "}
                <a
                  href={`https://wa.me/${r.contact_whatsapp}?text=${encodeURIComponent(`Hola, tu reporte ya está publicado en Huellitas HMO. Aquí puedes verlo e imprimir tu cartel: ${typeof window !== "undefined" ? window.location.origin : ""}/reportes/${r.id}/cartel`)}`}
                  target="_blank" rel="noopener noreferrer"
                >Mandar cartel por WhatsApp</a>
              </>
            )}
          </div>
          <div className="row-actions">
            {acciones[r.status].map(([label, dest, primary]) => (
              <button key={label} className={`btn ${primary ? "alt" : "ghost"}`} onClick={() => cambiar(r.id, dest)}>{label}</button>
            ))}
            {(r.status === "pendiente" || r.status === "activo") && (
              <button className="btn ghost" aria-expanded={abierto === r.id} onClick={() => setAbierto(abierto === r.id ? null : r.id)}>
                {abierto === r.id ? "Ocultar coincidencias" : "Buscar coincidencias"}
              </button>
            )}
          </div>
        </div>
        {abierto === r.id && <MatchPanel report={r} todos={items} onDone={() => { setAbierto(null); load(); }} />}
        </div>
      ))}
    </>
  );
}
