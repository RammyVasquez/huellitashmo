"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { errTexto, fechaCorta } from "@/lib/util";
import { CATEGORIAS, type AdminWelfare, type HelpContact } from "@/lib/types";

const ESTADOS = ["pendiente", "activo", "en_atencion", "resuelto", "cerrado"] as const;
type Estado = (typeof ESTADOS)[number];
const NOMBRE: Record<Estado, string> = { pendiente: "pendientes", activo: "activos", en_atencion: "en atención", resuelto: "resueltos", cerrado: "cerrados" };

export default function WelfareTab() {
  const [items, setItems] = useState<AdminWelfare[]>([]);
  const [filtro, setFiltro] = useState<Estado>("pendiente");
  const [msg, setMsg] = useState("");
  const [contactos, setContactos] = useState<HelpContact[]>([]);
  const [formKey, setFormKey] = useState(0);
  const [aviso, setAviso] = useState("");

  async function load() {
    const { data, error } = await supabase.from("welfare_reports").select("*").order("urgent", { ascending: false }).order("created_at", { ascending: false }).limit(300);
    if (error) setMsg(`No se pudieron cargar: ${errTexto(error)}`);
    setItems((data ?? []) as AdminWelfare[]);
    const c = await supabase.from("help_contacts").select("*").order("sort").order("name");
    setContactos((c.data ?? []) as HelpContact[]);
  }
  useEffect(() => { load(); }, []);

  async function probarAvisos() {
    setAviso("Enviando…");
    const { data } = await supabase.auth.getSession();
    const res = await fetch("/api/notificar-prueba", { method: "POST", headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` } });
    if (!res.ok) { setAviso("No se pudo probar (¿sesión vencida?)."); return; }
    const r = (await res.json()) as { telegram: string; correo: string };
    setAviso(`Telegram: ${r.telegram} · Correo: ${r.correo}`);
  }

  async function cambiar(id: string, status: Estado) {
    setMsg("");
    const { error } = await supabase.from("welfare_reports").update({ status, resolved_at: status === "resuelto" ? new Date().toISOString() : null }).eq("id", id);
    if (error) setMsg(`No se pudo actualizar: ${errTexto(error)}`); else load();
  }

  async function guardarNota(id: string, notas: string) {
    const { error } = await supabase.from("welfare_reports").update({ admin_notes: notas.trim() || null }).eq("id", id);
    if (error) setMsg(`No se pudo guardar la nota: ${errTexto(error)}`);
  }

  async function agregarContacto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("help_contacts").insert({
      name: String(fd.get("name")).trim(), phone: String(fd.get("phone")).trim(), note: String(fd.get("note")).trim() || null,
    });
    if (error) setMsg(`No se pudo guardar: ${errTexto(error)}`); else { setFormKey((k) => k + 1); load(); }
  }

  async function borrarContacto(c: HelpContact) {
    if (!confirm(`¿Quitar “${c.name}” de la lista pública?`)) return;
    const { error } = await supabase.from("help_contacts").delete().eq("id", c.id);
    if (error) setMsg(errTexto(error)); else load();
  }

  const lista = items.filter((r) => r.status === filtro);
  const cuenta = (e: Estado) => items.filter((r) => r.status === e).length;
  const urgentesPend = items.filter((r) => r.status === "pendiente" && r.urgent).length;

  const acciones = (r: AdminWelfare): [string, Estado, boolean][] => {
    const pub = CATEGORIAS[r.category].publica;
    switch (r.status) {
      case "pendiente": return [[pub ? "Validar y publicar" : "Validar (no se publica)", "activo", true], ["Descartar", "cerrado", false]];
      case "activo": return [["Marcar en atención", "en_atencion", true], ["Marcar resuelto", "resuelto", false], ["Cerrar", "cerrado", false]];
      case "en_atencion": return [["Marcar resuelto", "resuelto", true], ["Volver a activo", "activo", false], ["Cerrar", "cerrado", false]];
      case "resuelto": return [["Reabrir", "activo", false]];
      case "cerrado": return [["Reabrir", "pendiente", false]];
    }
  };

  return (
    <>
      <p className="muted" style={{ margin: "0 0 1rem" }}>
        <button className="btn ghost" onClick={probarAvisos}>Probar avisos al celular</button>{" "}
        <span role="status">{aviso}</span>
      </p>
      {urgentesPend > 0 && <p className="alertbox" role="alert"><b>{urgentesPend} {urgentesPend === 1 ? "reporte urgente pendiente" : "reportes urgentes pendientes"}.</b> Revísalos primero.</p>}
      <div className="chips">
        {ESTADOS.map((e) => (
          <a key={e} href="#" aria-current={filtro === e} onClick={(ev) => { ev.preventDefault(); setFiltro(e); }}>{NOMBRE[e]} ({cuenta(e)})</a>
        ))}
      </div>
      {msg && <p className="error" role="alert">{msg}</p>}
      {lista.length === 0 && <div className="empty">No hay casos en “{NOMBRE[filtro]}”.</div>}

      {lista.map((r) => (
        <div className="admin-row" key={r.id} style={{ alignItems: "flex-start" }}>
          <div className="thumbs">
            {(r.photos ?? []).slice(0, 5).map((u) => (
              <a key={u} href={u} target="_blank" rel="noopener noreferrer"><img className="thumb" src={u} alt="Foto del caso" /></a>
            ))}
            {!r.photos?.length && <div className="thumb" />}
          </div>
          <div className="grow">
            {r.urgent && <span className="tag alerta">urgente</span>}
            <span className="tag">{CATEGORIAS[r.category].titulo}</span>
            <span className="tag">{r.species}</span>
            {!CATEGORIAS[r.category].publica && <span className="tag">privado</span>}
            <span className="muted"> {r.zone} · {fechaCorta(r.created_at)}</span>
            <p style={{ margin: ".3rem 0" }}>{r.description}</p>
            <div>
              {r.lat != null && r.lng != null
                ? <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noopener noreferrer">Ver ubicación exacta</a>
                : <span className="muted">Sin ubicación en el mapa</span>}
              {" · "}
              {r.contact_whatsapp
                ? <a href={`https://wa.me/${r.contact_whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp de quien reportó</a>
                : <span className="muted">Reporte anónimo</span>}
              {r.allow_contact && <span className="tag ok" style={{ marginLeft: ".5rem" }}>acepta que le escriban</span>}
            </div>
            <label style={{ marginTop: ".6rem" }}>Notas internas (no son públicas)
              <textarea rows={2} defaultValue={r.admin_notes ?? ""} onBlur={(e) => guardarNota(r.id, e.target.value)} />
            </label>
          </div>
          <div className="row-actions">
            {acciones(r).map(([label, dest, primary]) => (
              <button key={label} className={`btn ${primary ? "alt" : "ghost"}`} onClick={() => cambiar(r.id, dest)}>{label}</button>
            ))}
          </div>
        </div>
      ))}

      <h2 style={{ marginTop: "3rem" }}>Contactos de ayuda (públicos)</h2>
      <p className="muted">Veterinarios 24 h, rescatistas o autoridades. Verifica cada número antes de publicarlo: aparece en la página de Rescate.</p>
      <form className="stack" key={formKey} onSubmit={agregarContacto}>
        <label>Nombre<input name="name" required placeholder="Ej. Clínica veterinaria 24 horas" /></label>
        <label>Teléfono<input name="phone" type="tel" required /></label>
        <label>Nota (opcional)<input name="note" placeholder="Ej. Atiende urgencias de noche" /></label>
        <button className="btn">Agregar contacto</button>
      </form>
      {contactos.map((c) => (
        <div className="admin-row" key={c.id}>
          <div className="grow"><b>{c.name}</b> · {c.phone}{c.note && <span className="muted"> · {c.note}</span>}</div>
          <div className="row-actions"><button className="btn ghost" onClick={() => borrarContacto(c)}>Quitar</button></div>
        </div>
      ))}
    </>
  );
}
