"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { coincide } from "@/lib/buscar";
import { errTexto, fechaCorta } from "@/lib/util";
import MatchPanel from "./MatchPanel";
import ReportEditor from "./ReportEditor";
import type { AdminReport, ReportTip } from "@/lib/types";

const ESTADOS = ["pendiente", "activo", "reunificado", "cerrado"] as const;
type Estado = (typeof ESTADOS)[number];

export default function ReportsTab() {
  const [items, setItems] = useState<AdminReport[]>([]);
  const [filtro, setFiltro] = useState<Estado>("pendiente");
  const [msg, setMsg] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [tips, setTips] = useState<ReportTip[]>([]);
  const [aviso, setAviso] = useState<{ texto: string; enlaces: { id: string; etiqueta: string }[] } | null>(null);

  async function load() {
    const { data, error } = await supabase.from("reports").select("id, kind, species, description, photo_url, photos, zone, lat, lng, contact_whatsapp, status, created_at, private_detail").order("created_at", { ascending: false }).limit(300);
    if (error) setMsg(`No se pudieron cargar: ${errTexto(error)}`);
    setItems((data ?? []) as AdminReport[]);
    const t = await supabase.from("report_tips").select("*").order("created_at", { ascending: false }).limit(500);
    setTips((t.data ?? []) as ReportTip[]);
  }
  useEffect(() => { load(); }, []);

  async function cambiar(id: string, status: Estado) {
    setMsg("");
    const { error } = await supabase
      .from("reports")
      .update({ status, resolved_at: status === "reunificado" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) { setMsg(`No se pudo actualizar: ${errTexto(error)}`); return; }
    load();
    setAviso(null);
    if (status === "activo") {
      // Busca posibles coincidencias con lo ya publicado (misma especie, cerca, tipo contrario) y avisa por Telegram
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/coincidencias", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` }, body: JSON.stringify({ id }) });
        const j = (await res.json().catch(() => ({}))) as { candidatos?: { id: string; kind: string; zone: string | null; km: number | null; rasgos: string[] }[] };
        const c = j.candidatos ?? [];
        if (c.length) setAviso({
          texto: `Publicado. Hay ${c.length} ${c.length === 1 ? "posible coincidencia" : "posibles coincidencias"} (misma especie, cerca y reciente). Revisa las fotos:`,
          enlaces: c.map((x) => ({ id: x.id, etiqueta: `${x.kind} en ${x.zone ?? "sin zona"}${x.km != null ? ` (a ${x.km < 1 ? Math.round(x.km * 1000) + " m" : x.km.toFixed(1) + " km"})` : ""}${x.rasgos.length ? ` · ${x.rasgos.join(", ")}` : ""}` })),
        });
      } catch { /* si falla la búsqueda, el reporte ya quedó publicado */ }
    }
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
      {aviso && (
        <div className="box" role="status">
          <b>{aviso.texto}</b>
          <ul style={{ margin: ".5rem 0 0" }}>{aviso.enlaces.map((e) => <li key={e.id}><a href={`/reportes/${e.id}`} target="_blank" rel="noopener noreferrer">{e.etiqueta}</a></li>)}</ul>
          <button className="btn ghost" style={{ marginTop: ".6rem" }} onClick={() => setAviso(null)}>Cerrar</button>
        </div>
      )}
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
            {r.private_detail && <p style={{ margin: ".3rem 0" }}><b>Detalle reservado</b> <span className="muted">(no se publica; úsalo para confirmar al dueño)</span>: {r.private_detail}</p>}
            {r.contact_whatsapp
              ? <a href={`https://wa.me/${r.contact_whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp de quien reportó</a>
              : <span className="muted">Reportó sin WhatsApp</span>}
            {" · "}
            {r.lat != null && r.lng != null
              ? <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noopener noreferrer">Ver ubicación exacta</a>
              : <span className="muted">Sin ubicación en el mapa</span>}
            {r.status === "activo" && r.contact_whatsapp && (
              <>
                {" · "}
                <a
                  href={`https://wa.me/${r.contact_whatsapp}?text=${encodeURIComponent(`Hola, tu reporte ya está publicado en Huellitas HMO. Aquí puedes verlo e imprimir tu cartel: ${typeof window !== "undefined" ? window.location.origin : ""}/reportes/${r.id}/cartel`)}`}
                  target="_blank" rel="noopener noreferrer"
                >Mandar cartel por WhatsApp</a>

              </>
            )}
            {r.status === "activo" && <>{" · "}<a href={`/reportes/${r.id}/kit`} target="_blank" rel="noopener noreferrer">Kit para compartir</a></>}
            {tips.filter((t) => t.report_id === r.id).length > 0 && (
              <details style={{ marginTop: ".4rem" }}>
                <summary><b>Información recibida ({tips.filter((t) => t.report_id === r.id).length})</b></summary>
                {tips.filter((t) => t.report_id === r.id).map((t) => (
                  <p key={t.id} style={{ margin: ".3rem 0" }}>{t.message}<br /><span className="muted">{fechaCorta(t.created_at)}{t.contact ? ` · Contacto: ${t.contact}` : " · Sin contacto"}</span></p>
                ))}
              </details>
            )}
          </div>
          <div className="row-actions">
            <button className="btn ghost" aria-expanded={editando === r.id} onClick={() => { setEditando(editando === r.id ? null : r.id); setAbierto(null); }}>{editando === r.id ? "Cerrar edición" : "Editar"}</button>
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
        {editando === r.id && <ReportEditor report={r} onSaved={() => { setEditando(null); load(); setMsg(""); }} onCancel={() => setEditando(null)} />}
        {abierto === r.id && <MatchPanel report={r} todos={items} onDone={() => { setAbierto(null); load(); }} />}
        </div>
      ))}
    </>
  );
}
