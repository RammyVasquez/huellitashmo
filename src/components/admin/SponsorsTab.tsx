"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { errTexto } from "@/lib/util";
import { useShelters } from "./useShelters";
import type { Animal, Sponsorship } from "@/lib/types";

type AnimalMin = Pick<Animal, "id" | "name" | "shelter_id" | "status">;
const hoy = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Hermosillo" });
const fecha = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
const SUGERENCIAS = ["Alimento del mes", "Vacunas", "Consulta veterinaria", "Medicinas", "Esterilización o castración", "Cobijas y camita", "Croquetas por bulto"];

export default function SponsorsTab({ shelterId }: { shelterId?: string }) {
  const { shelters } = useShelters();
  const [padrinos, setPadrinos] = useState<Sponsorship[]>([]);
  const [animals, setAnimals] = useState<AnimalMin[]>([]);
  const [editando, setEditando] = useState<Sponsorship | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const load = useCallback(async () => {
    let qa = supabase.from("animals").select("id, name, shelter_id, status").order("name");
    if (shelterId) qa = qa.eq("shelter_id", shelterId);
    const a = await qa;
    setAnimals((a.data ?? []) as AnimalMin[]);
    let qs = supabase.from("sponsorships").select("*").order("started_on", { ascending: false });
    if (shelterId) qs = qs.eq("shelter_id", shelterId);
    const s = await qs;
    if (s.error) setMsg({ ok: false, text: `No se pudo cargar el registro: ${errTexto(s.error)}` });
    setPadrinos((s.data ?? []) as Sponsorship[]);
  }, [shelterId]);
  useEffect(() => { load(); }, [load]);

  const animal = (id: string) => animals.find((a) => a.id === id);
  const refugio = (id: string | null | undefined) => shelters.find((s) => s.id === id)?.name ?? "";

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setGuardando(true); setMsg(null);
    try {
      const a = animal(String(fd.get("animal_id")));
      if (!a || !a.shelter_id) throw new Error("Elige un animal que pertenezca a un refugio.");
      const inicio = String(fd.get("started_on"));
      const fin = String(fd.get("ended_on") ?? "");
      if (fin && fin < inicio) throw new Error("La fecha de término no puede ser antes del inicio.");
      const payload = {
        animal_id: a.id, shelter_id: a.shelter_id,
        sponsor_name: String(fd.get("sponsor_name")).trim(),
        contact: String(fd.get("contact") ?? "").trim() || null,
        support: String(fd.get("support")).trim(),
        started_on: inicio, ended_on: fin || null,
        note: String(fd.get("note") ?? "").trim() || null,
      };
      const { error } = editando
        ? await supabase.from("sponsorships").update(payload).eq("id", editando.id)
        : await supabase.from("sponsorships").insert(payload);
      if (error) throw error;
      setMsg({ ok: true, text: editando ? "Cambios guardados." : "Padrino registrado." });
      setEditando(null); setFormKey((k) => k + 1); load();
    } catch (err) { setMsg({ ok: false, text: errTexto(err) }); }
    setGuardando(false);
  }

  async function terminar(p: Sponsorship, reactivar: boolean) {
    const { error } = await supabase.from("sponsorships").update({ ended_on: reactivar ? null : (hoy() < p.started_on ? p.started_on : hoy()) }).eq("id", p.id);
    if (error) setMsg({ ok: false, text: errTexto(error) }); else load();
  }

  async function eliminar(p: Sponsorship) {
    if (!confirm(`¿Eliminar el registro de ${p.sponsor_name}? Úsalo solo si fue un error: se descuenta de las cifras.`)) return;
    const { error } = await supabase.from("sponsorships").delete().eq("id", p.id);
    if (error) setMsg({ ok: false, text: errTexto(error) }); else load();
  }

  const activos = padrinos.filter((p) => !p.ended_on).length;
  const opciones = animals.filter((a) => a.status !== "adoptado" || editando?.animal_id === a.id);

  return (
    <>
      <p className="muted" style={{ maxWidth: "65ch" }}>
        Anota aquí a cada persona que apadrina a un animal: su nombre o apodo, lo que cubre y desde cuándo. El número de padrinos de cada animal y la cifra de Impacto se calculan solos a partir de este registro.
        <b> Estos datos son privados: en el sitio solo se muestra cuántos padrinos tiene un animal.</b>
      </p>

      <h2>{editando ? "Editar padrino" : "Registrar un padrino"}</h2>
      <form className="stack" key={formKey} onSubmit={guardar}>
        <label>Animal
          <select name="animal_id" required defaultValue={editando?.animal_id ?? ""}>
            <option value="" disabled>Elige un animal</option>
            {opciones.map((a) => <option key={a.id} value={a.id}>{a.name}{!shelterId && a.shelter_id ? ` · ${refugio(a.shelter_id)}` : ""}</option>)}
          </select>
        </label>
        <label>Nombre o apodo de la persona<input name="sponsor_name" required minLength={2} maxLength={80} defaultValue={editando?.sponsor_name ?? ""} /></label>
        <label>Qué cubre
          <input name="support" required minLength={2} maxLength={160} list="apoyos" defaultValue={editando?.support ?? ""} placeholder="Ej. Alimento del mes" />
          <datalist id="apoyos">{SUGERENCIAS.map((s) => <option key={s} value={s} />)}</datalist>
        </label>
        <div className="two">
          <label>Desde<input name="started_on" type="date" required defaultValue={editando?.started_on ?? hoy()} /></label>
          <label>Hasta (si ya terminó)<input name="ended_on" type="date" defaultValue={editando?.ended_on ?? ""} /></label>
        </div>
        <label>Contacto (opcional, privado)<input name="contact" maxLength={120} defaultValue={editando?.contact ?? ""} placeholder="WhatsApp o correo" /></label>
        <label>Nota (opcional)<input name="note" maxLength={400} defaultValue={editando?.note ?? ""} /></label>
        <div className="actions" style={{ margin: 0 }}>
          <button className="btn" disabled={guardando}>{guardando ? "Guardando…" : editando ? "Guardar cambios" : "Registrar padrino"}</button>
          {editando && <button type="button" className="btn ghost" onClick={() => { setEditando(null); setFormKey((k) => k + 1); }}>Cancelar</button>}
        </div>
        {msg && <p className={msg.ok ? "ok" : "error"} role="status">{msg.text}</p>}
      </form>

      <h2 style={{ marginTop: "2.5rem" }}>Registro ({padrinos.length}) <span className="muted" style={{ fontSize: "1rem", fontWeight: 400 }}>· {activos} vigentes</span></h2>
      {padrinos.length === 0 && <div className="empty">Aún no hay padrinos registrados.</div>}
      {padrinos.map((p) => (
        <div className="admin-row" key={p.id}>
          <div className="grow">
            <b>{p.sponsor_name}</b> apadrina a <b>{animal(p.animal_id)?.name ?? "un animal"}</b>{" "}
            <span className={`tag ${p.ended_on ? "" : "ok"}`}>{p.ended_on ? "terminado" : "vigente"}</span>
            <div className="muted">{p.support} · desde {fecha(p.started_on)}{p.ended_on ? ` hasta ${fecha(p.ended_on)}` : ""}{!shelterId && animal(p.animal_id)?.shelter_id ? ` · ${refugio(animal(p.animal_id)?.shelter_id)}` : ""}</div>
          </div>
          <div className="row-actions">
            <button className="btn ghost" onClick={() => { setEditando(p); setFormKey((k) => k + 1); window.scrollTo({ top: 0 }); }}>Editar</button>
            <button className="btn ghost" onClick={() => terminar(p, !!p.ended_on)}>{p.ended_on ? "Reactivar" : "Marcar terminado"}</button>
            <button className="btn ghost" onClick={() => eliminar(p)}>Eliminar</button>
          </div>
        </div>
      ))}
    </>
  );
}
