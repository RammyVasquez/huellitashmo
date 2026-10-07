"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/upload";
import { errTexto } from "@/lib/util";
import PhotoPicker from "../PhotoPicker";
import { useShelters } from "./useShelters";
import { TIPOS_EVENTO, type EventKind, type EventRow } from "@/lib/types";

// El horario se captura como hora de Hermosillo (UTC-7, sin horario de verano)
const aISO = (v: string) => new Date(`${v}:00-07:00`).toISOString();
const aInput = (iso: string | null) => (iso ? new Date(iso).toLocaleString("sv-SE", { timeZone: "America/Hermosillo" }).replace(" ", "T").slice(0, 16) : "");
const cuando = (iso: string) => new Date(iso).toLocaleString("es-MX", { timeZone: "America/Hermosillo", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const num = (v: FormDataEntryValue | null) => (v === null || String(v).trim() === "" ? null : Math.max(0, Math.round(Number(v))));

export default function EventsTab({ shelterId }: { shelterId?: string }) {
  const { shelters } = useShelters();
  const [eventos, setEventos] = useState<EventRow[]>([]);
  const [editando, setEditando] = useState<EventRow | null>(null);
  const [cerrando, setCerrando] = useState<EventRow | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [nuevas, setNuevas] = useState<File[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("events").select("*").order("starts_at", { ascending: false });
    if (error) setMsg({ ok: false, text: `No se pudieron cargar: ${errTexto(error)}` });
    const todos = (data ?? []) as EventRow[];
    setEventos(shelterId ? todos.filter((e) => e.shelter_id === shelterId) : todos);
  }, [shelterId]);
  useEffect(() => { load(); }, [load]);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setTrabajando(true); setMsg(null);
    try {
      const inicio = String(fd.get("starts_at"));
      const fin = String(fd.get("ends_at") ?? "");
      if (fin && aISO(fin) < aISO(inicio)) throw new Error("El fin no puede ser antes del inicio.");
      const payload = {
        shelter_id: shelterId ?? (String(fd.get("shelter_id")) || null),
        title: String(fd.get("title")).trim(), kind: fd.get("kind"),
        description: String(fd.get("description")).trim() || null,
        starts_at: aISO(inicio), ends_at: fin ? aISO(fin) : null,
        place: String(fd.get("place")).trim() || null, address: String(fd.get("address")).trim() || null,
      };
      const { error } = editando
        ? await supabase.from("events").update(payload).eq("id", editando.id)
        : await supabase.from("events").insert({ ...payload, status: "programado" });
      if (error) throw error;
      setMsg({ ok: true, text: editando ? "Cambios guardados." : "Evento programado." });
      setEditando(null); setFormKey((k) => k + 1); load();
    } catch (err) { setMsg({ ok: false, text: errTexto(err) }); }
    setTrabajando(false);
  }

  async function marcarRealizado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cerrando) return;
    const fd = new FormData(e.currentTarget);
    setTrabajando(true); setMsg(null);
    try {
      if (nuevas.length + (cerrando.photos?.length ?? 0) > 6) throw new Error("Máximo 6 fotos.");
      const subidas = await Promise.all(nuevas.map((f) => uploadPhoto(f, "animales")));
      const { error } = await supabase.from("events").update({
        status: "realizado", attendees: num(fd.get("attendees")), adoptions_count: num(fd.get("adoptions_count")),
        sterilizations_count: num(fd.get("sterilizations_count")), results_note: String(fd.get("results_note")).trim() || null,
        photos: [...(cerrando.photos ?? []), ...subidas],
      }).eq("id", cerrando.id);
      if (error) throw error;
      setCerrando(null); setNuevas([]); load();
      setMsg({ ok: true, text: "Evento marcado como realizado." });
    } catch (err) { setMsg({ ok: false, text: errTexto(err) }); }
    setTrabajando(false);
  }

  async function estado(ev: EventRow, status: EventRow["status"]) {
    if (status === "cancelado" && !confirm(`¿Cancelar “${ev.title}”? Dejará de mostrarse en el sitio.`)) return;
    const { error } = await supabase.from("events").update({ status }).eq("id", ev.id);
    if (error) setMsg({ ok: false, text: errTexto(error) }); else load();
  }

  if (cerrando)
    return (
      <form className="stack" onSubmit={marcarRealizado}>
        <h2>Resultados de “{cerrando.title}”</h2>
        <p className="muted">Estas cifras se muestran en la página de Impacto: escribe solo lo que sea verdad y puedas comprobar. Deja vacío lo que no sepas.</p>
        <div className="two">
          <label>Asistentes (aprox.)<input name="attendees" type="number" min={0} /></label>
          <label>Adopciones logradas<input name="adoptions_count" type="number" min={0} /></label>
        </div>
        <label>Esterilizaciones y castraciones realizadas<input name="sterilizations_count" type="number" min={0} /></label>
        <label>Resumen (ej. “12 kg de croquetas y 8 cobijas recibidas”)<textarea name="results_note" rows={3} maxLength={400} /></label>
        <div><b>Fotos del evento <span className="muted" style={{ fontWeight: 400 }}>(opcional)</span></b><PhotoPicker max={Math.max(0, 6 - (cerrando.photos?.length ?? 0))} onChange={setNuevas} /></div>
        {msg && !msg.ok && <p className="error" role="alert">{msg.text}</p>}
        <div className="actions" style={{ margin: 0 }}>
          <button className="btn" disabled={trabajando}>{trabajando ? "Guardando…" : "Marcar como realizado"}</button>
          <button type="button" className="btn ghost" onClick={() => setCerrando(null)}>Cancelar</button>
        </div>
      </form>
    );

  return (
    <>
      <h2>{editando ? `Editar “${editando.title}”` : "Programar un evento"}</h2>
      <form className="stack" key={formKey} onSubmit={guardar}>
        <label>Título<input name="title" required maxLength={120} defaultValue={editando?.title ?? ""} placeholder="Ej. Jornada de adopción en el parque" /></label>
        <label>Tipo
          <select name="kind" defaultValue={editando?.kind ?? "adopcion"}>
            {(Object.keys(TIPOS_EVENTO) as EventKind[]).map((k) => <option key={k} value={k}>{TIPOS_EVENTO[k]}</option>)}
          </select>
        </label>
        <div className="two">
          <label>Inicia (hora de Hermosillo)<input name="starts_at" type="datetime-local" required defaultValue={aInput(editando?.starts_at ?? null)} /></label>
          <label>Termina (opcional)<input name="ends_at" type="datetime-local" defaultValue={aInput(editando?.ends_at ?? null)} /></label>
        </div>
        <label>Lugar público (parque, plaza, clínica)<input name="place" maxLength={120} defaultValue={editando?.place ?? ""} /></label>
        <label>Dirección o referencia (opcional)<input name="address" maxLength={160} defaultValue={editando?.address ?? ""} /></label>
        <label>Descripción<textarea name="description" rows={4} maxLength={800} defaultValue={editando?.description ?? ""} /></label>
        {!shelterId && (
          <label>Organiza
            <select name="shelter_id" defaultValue={editando?.shelter_id ?? ""}>
              <option value="">Equipo de Huellitas HMO</option>
              {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}
        <p className="muted" style={{ margin: 0, fontSize: ".92rem" }}>Usa un lugar público: este dato se muestra en el sitio. No pongas la dirección de una casa.</p>
        <div className="actions" style={{ margin: 0 }}>
          <button className="btn" disabled={trabajando}>{trabajando ? "Guardando…" : editando ? "Guardar cambios" : "Programar evento"}</button>
          {editando && <button type="button" className="btn ghost" onClick={() => { setEditando(null); setFormKey((k) => k + 1); }}>Cancelar</button>}
        </div>
        {msg && <p className={msg.ok ? "ok" : "error"} role="status">{msg.text}</p>}
      </form>

      <h2 style={{ marginTop: "2.5rem" }}>Eventos ({eventos.length})</h2>
      {eventos.length === 0 && <div className="empty">Aún no hay eventos.</div>}
      {eventos.map((ev) => (
        <div className="admin-row" key={ev.id}>
          <div className="grow">
            <b>{ev.title}</b> <span className={`tag ${ev.status === "realizado" ? "ok" : ev.status === "cancelado" ? "alerta" : ""}`}>{ev.status}</span>
            <div className="muted">{TIPOS_EVENTO[ev.kind]} · {cuando(ev.starts_at)}{ev.place ? ` · ${ev.place}` : ""}</div>
            {ev.status === "realizado" && (
              <div className="muted">{[ev.attendees != null ? `${ev.attendees} asistentes` : "", ev.adoptions_count != null ? `${ev.adoptions_count} adopciones` : "", ev.sterilizations_count != null ? `${ev.sterilizations_count} esterilizaciones y castraciones` : ""].filter(Boolean).join(" · ")}</div>
            )}
          </div>
          <div className="row-actions">
            {ev.status === "programado" && <button className="btn alt" onClick={() => setCerrando(ev)}>Marcar realizado</button>}
            <button className="btn ghost" onClick={() => { setEditando(ev); setFormKey((k) => k + 1); window.scrollTo({ top: 0 }); }}>Editar</button>
            {ev.status === "programado" && <button className="btn ghost" onClick={() => estado(ev, "cancelado")}>Cancelar</button>}
            {ev.status === "cancelado" && <button className="btn ghost" onClick={() => estado(ev, "programado")}>Reprogramar</button>}
          </div>
        </div>
      ))}
    </>
  );
}
