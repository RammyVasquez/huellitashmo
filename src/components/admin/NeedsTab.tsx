"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { errTexto } from "@/lib/util";
import { useShelters } from "./useShelters";
import type { ShelterNeed } from "@/lib/types";

export default function NeedsTab() {
  const { shelters, cargando } = useShelters();
  const [shelterId, setShelterId] = useState("");
  const [needs, setNeeds] = useState<ShelterNeed[]>([]);
  const [formKey, setFormKey] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => { if (!shelterId && shelters[0]) setShelterId(shelters[0].id); }, [shelters, shelterId]);

  const load = useCallback(async () => {
    if (!shelterId) return;
    const { data } = await supabase.from("shelter_needs").select("*").eq("shelter_id", shelterId).order("fulfilled").order("urgent", { ascending: false });
    setNeeds((data ?? []) as ShelterNeed[]);
  }, [shelterId]);
  useEffect(() => { load(); }, [load]);

  async function agregar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg("");
    const { error } = await supabase.from("shelter_needs").insert({
      shelter_id: shelterId,
      item: String(fd.get("item")).trim(),
      detail: String(fd.get("detail")).trim() || null,
      urgent: fd.get("urgent") === "on",
    });
    if (error) setMsg(`No se pudo guardar: ${errTexto(error)}`);
    else { setFormKey((k) => k + 1); load(); }
  }

  async function patch(id: string, values: Partial<ShelterNeed>) {
    const { error } = await supabase.from("shelter_needs").update(values).eq("id", id);
    if (error) setMsg(errTexto(error)); else load();
  }

  async function borrar(n: ShelterNeed) {
    if (!confirm(`¿Eliminar “${n.item}”? Si ya se cubrió, mejor márcala como cubierta.`)) return;
    const { error } = await supabase.from("shelter_needs").delete().eq("id", n.id);
    if (error) setMsg(errTexto(error)); else load();
  }

  if (!cargando && shelters.length === 0)
    return <div className="empty">Primero registra un refugio en la pestaña “Refugios”.</div>;

  return (
    <>
      <label style={{ maxWidth: 540 }}>Refugio
        <select value={shelterId} onChange={(e) => setShelterId(e.target.value)}>
          {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>

      <h2 style={{ marginTop: "1.6rem" }}>Agregar necesidad</h2>
      <form className="stack" key={formKey} onSubmit={agregar}>
        <label>¿Qué hace falta? (ej. “Croquetas para perro adulto”)<input name="item" required /></label>
        <label>Detalle (opcional, ej. “Bultos de 20 kg, cualquier marca”)<input name="detail" /></label>
        <label className="check"><input type="checkbox" name="urgent" /> Es urgente</label>
        <button className="btn">Agregar a la lista</button>
      </form>
      {msg && <p className="error" role="alert">{msg}</p>}

      <h2 style={{ marginTop: "2.5rem" }}>Lista actual</h2>
      {needs.length === 0 && <div className="empty">Este refugio no tiene necesidades registradas.</div>}
      {needs.map((n) => (
        <div className="admin-row" key={n.id} style={{ opacity: n.fulfilled ? 0.55 : 1 }}>
          <div className="grow">
            <b>{n.item}</b> {n.urgent && !n.fulfilled && <span className="tag urgente">urgente</span>}
            {n.fulfilled && <span className="tag ok">cubierta</span>}
            {n.detail && <div className="muted">{n.detail}</div>}
          </div>
          <div className="row-actions">
            <button className="btn alt" onClick={() => patch(n.id, { fulfilled: !n.fulfilled })}>{n.fulfilled ? "Reabrir" : "Ya se cubrió"}</button>
            {!n.fulfilled && <button className="btn ghost" onClick={() => patch(n.id, { urgent: !n.urgent })}>{n.urgent ? "Quitar urgente" : "Marcar urgente"}</button>}
            <button className="btn ghost" onClick={() => borrar(n)}>Eliminar</button>
          </div>
        </div>
      ))}
    </>
  );
}
