"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { errTexto, fechaCorta } from "@/lib/util";
import type { AdminReport } from "@/lib/types";

const ESTADOS = ["pendiente", "activo", "reunificado", "cerrado"] as const;
type Estado = (typeof ESTADOS)[number];

export default function ReportsTab() {
  const [items, setItems] = useState<AdminReport[]>([]);
  const [filtro, setFiltro] = useState<Estado>("pendiente");
  const [msg, setMsg] = useState("");

  async function load() {
    const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(300);
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

  const lista = items.filter((r) => r.status === filtro);
  const cuenta = (e: Estado) => items.filter((r) => r.status === e).length;

  const acciones: Record<Estado, [string, Estado, boolean][]> = {
    pendiente: [["Publicar", "activo", true], ["Descartar", "cerrado", false]],
    activo: [["Marcar reunificado", "reunificado", true], ["Cerrar", "cerrado", false]],
    reunificado: [["Reabrir", "activo", false]],
    cerrado: [["Volver a publicar", "activo", false]],
  };

  return (
    <>
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
        <div className="admin-row" key={r.id}>
          {r.photo_url ? <img className="thumb" src={r.photo_url} alt="" /> : <div className="thumb" />}
          <div className="grow">
            <span className={`tag ${r.kind}`}>{r.kind}</span><span className="tag">{r.species}</span>
            <span className="muted"> {r.zone} · {fechaCorta(r.created_at)}</span>
            <p style={{ margin: ".3rem 0" }}>{r.description}</p>
            <a href={`https://wa.me/${r.contact_whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp de quien reportó</a>
          </div>
          <div className="row-actions">
            {acciones[r.status].map(([label, dest, primary]) => (
              <button key={label} className={`btn ${primary ? "alt" : "ghost"}`} onClick={() => cambiar(r.id, dest)}>{label}</button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
