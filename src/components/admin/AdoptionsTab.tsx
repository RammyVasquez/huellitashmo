"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { errTexto, fechaCorta } from "@/lib/util";
import { ABIERTAS, ADAPTACION, alertas, ESTADOS_SOLICITUD, ETIQUETA_ESTADO, resumenParaRefugio, sumarMeses, VIVIENDA, type EstadoSolicitud } from "@/lib/adopciones";
import type { AdoptionRequest, Followup } from "@/lib/types";
import { useShelters } from "./useShelters";

type Grupo = "nuevas" | "proceso" | "adoptadas" | "cerradas";
const GRUPOS: Record<Grupo, { nombre: string; estados: EstadoSolicitud[] }> = {
  nuevas: { nombre: "Nuevas", estados: ["nueva"] },
  proceso: { nombre: "En proceso", estados: ["contactado", "entrevista", "visita", "aprobada"] },
  adoptadas: { nombre: "Adoptadas", estados: ["adoptado"] },
  cerradas: { nombre: "Cerradas", estados: ["rechazada", "cancelada"] },
};

export default function AdoptionsTab() {
  const { shelters } = useShelters();
  const [items, setItems] = useState<AdoptionRequest[]>([]);
  const [seguimientos, setSeguimientos] = useState<Followup[]>([]);
  const [grupo, setGrupo] = useState<Grupo>("nuevas");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const a = await supabase.from("adoption_requests")
      .select("*, animals(name, photo_url, species, shelter_id, status, good_kids, good_pets, size, energy)")
      .order("created_at", { ascending: false }).limit(300);
    if (a.error) setMsg(`No se pudieron cargar las solicitudes: ${errTexto(a.error)}`);
    setItems((a.data ?? []) as unknown as AdoptionRequest[]);
    const f = await supabase.from("adoption_followups")
      .select("*, adoption_requests(applicant_name, whatsapp, animals(name))").order("due_date").limit(500);
    setSeguimientos((f.data ?? []) as unknown as Followup[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const refugioDe = (r: AdoptionRequest) => shelters.find((s) => s.id === r.animals?.shelter_id);

  async function cambiarEstado(r: AdoptionRequest, estado: EstadoSolicitud) {
    if (estado === "adoptado") return marcarAdoptado(r);
    setMsg("");
    const { error } = await supabase.from("adoption_requests").update({ status: estado, updated_at: new Date().toISOString() }).eq("id", r.id);
    if (error) setMsg(`No se pudo actualizar: ${errTexto(error)}`); else load();
  }

  async function marcarAdoptado(r: AdoptionRequest) {
    const otras = items.filter((x) => x.animal_id === r.animal_id && x.id !== r.id && ABIERTAS.includes(x.status)).length;
    if (!confirm(`¿Confirmas que ${r.animals?.name ?? "el animal"} fue adoptado por ${r.applicant_name}?\n\nSe marcará el animal como adoptado${otras ? `, se cancelarán las otras ${otras} solicitudes abiertas` : ""} y se programarán seguimientos a 1, 3 y 6 meses.`)) return;
    setMsg("");
    const ahora = new Date().toISOString();
    try {
      const e1 = await supabase.from("adoption_requests").update({ status: "adoptado", adopted_at: ahora, updated_at: ahora }).eq("id", r.id);
      if (e1.error) throw e1.error;
      const e2 = await supabase.from("animals").update({ status: "adoptado", adopted_at: ahora }).eq("id", r.animal_id);
      if (e2.error) throw e2.error;
      const e3 = await supabase.from("adoption_requests").update({ status: "cancelada", updated_at: ahora })
        .eq("animal_id", r.animal_id).neq("id", r.id).in("status", ABIERTAS);
      if (e3.error) throw e3.error;
      const ex = await supabase.from("adoption_followups").select("id", { count: "exact", head: true }).eq("request_id", r.id);
      if ((ex.count ?? 0) === 0) {
        const e4 = await supabase.from("adoption_followups").insert([1, 3, 6].map((m) => ({ request_id: r.id, stage: m, due_date: sumarMeses(m) })));
        if (e4.error) throw e4.error;
      }
      load();
    } catch (err) {
      setMsg(`No se pudo completar: ${errTexto(err)}`);
    }
  }

  async function guardarNota(id: string, notas: string) {
    const { error } = await supabase.from("adoption_requests").update({ admin_notes: notas.trim() || null }).eq("id", id);
    if (error) setMsg(`No se pudo guardar la nota: ${errTexto(error)}`);
  }

  function enviarSeguimiento(f: Followup) {
    const wa = f.adoption_requests?.whatsapp;
    if (!wa) return;
    const nombre = f.adoption_requests?.applicant_name.split(" ")[0] ?? "";
    const animal = f.adoption_requests?.animals?.name ?? "tu mascota";
    const liga = `${window.location.origin}/seguimiento/${f.token}`;
    const texto = `Hola ${nombre}, ¡esperamos que ${animal} esté muy bien! Nos gustaría saber cómo va su adaptación. ¿Nos cuentas en 2 minutos? ${liga}`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
    supabase.from("adoption_followups").update({ status: "enviado", sent_at: new Date().toISOString() }).eq("id", f.id).then(() => load());
  }

  async function omitirSeguimiento(f: Followup) {
    if (!confirm("¿Omitir este seguimiento? Ya no se te recordará.")) return;
    const { error } = await supabase.from("adoption_followups").update({ status: "omitido" }).eq("id", f.id);
    if (error) setMsg(errTexto(error)); else load();
  }

  const cuenta = (g: Grupo) => items.filter((r) => GRUPOS[g].estados.includes(r.status)).length;
  const lista = items.filter((r) => GRUPOS[grupo].estados.includes(r.status));
  const hoy = new Date().toISOString().slice(0, 10);
  const porEnviar = seguimientos.filter((f) => f.status === "pendiente" && f.due_date <= hoy);
  const programados = seguimientos.filter((f) => f.status === "pendiente" && f.due_date > hoy);
  const esperando = seguimientos.filter((f) => f.status === "enviado");
  const respondidos = seguimientos.filter((f) => f.status === "respondido");

  const filaSeg = (f: Followup, acciones: "enviar" | "reenviar" | "ver" | "ninguna") => (
    <div className="admin-row" key={f.id}>
      <div className="grow">
        <b>{f.adoption_requests?.animals?.name ?? "Animal"}</b> · {f.adoption_requests?.applicant_name}
        <span className="tag" style={{ marginLeft: ".5rem" }}>{f.stage} {f.stage === 1 ? "mes" : "meses"}</span>
        <span className="muted"> · le toca el {fechaCorta(f.due_date)}</span>
        {acciones === "ver" && (
          <div style={{ marginTop: ".4rem" }}>
            <span className={`tag ${f.adapted === "con_dificultades" ? "alerta" : "ok"}`}>{f.adapted ? ADAPTACION[f.adapted] : "—"}</span>
            {(f.photos?.length ?? 0) > 0 && <span className={`tag ${f.photo_consent ? "ok" : "alerta"}`}>{f.photo_consent ? "autorizó usar las fotos" : "NO autorizó usar las fotos"}</span>}
            {f.notes && <p style={{ margin: ".3rem 0" }}>{f.notes}</p>}
            <div className="thumbs">{(f.photos ?? []).map((u) => <a key={u} href={u} target="_blank" rel="noopener noreferrer"><img className="thumb" src={u} alt="Foto del seguimiento" /></a>)}</div>
          </div>
        )}
      </div>
      <div className="row-actions">
        {(acciones === "enviar" || acciones === "reenviar") && <button className="btn alt" onClick={() => enviarSeguimiento(f)}>{acciones === "enviar" ? "Enviar por WhatsApp" : "Reenviar"}</button>}
        {(acciones === "enviar" || acciones === "reenviar") && <button className="btn ghost" onClick={() => omitirSeguimiento(f)}>Omitir</button>}
      </div>
    </div>
  );

  return (
    <>
      {msg && <p className="error" role="alert">{msg}</p>}
      <div className="chips">
        {(Object.keys(GRUPOS) as Grupo[]).map((g) => (
          <a key={g} href="#" aria-current={grupo === g} onClick={(e) => { e.preventDefault(); setGrupo(g); }}>{GRUPOS[g].nombre} ({cuenta(g)})</a>
        ))}
      </div>

      {lista.length === 0 && <div className="empty">No hay solicitudes en “{GRUPOS[grupo].nombre.toLowerCase()}”.</div>}
      {lista.map((r) => {
        const sh = refugioDe(r);
        const av = alertas(r);
        return (
          <div className="admin-row" key={r.id} style={{ alignItems: "flex-start" }}>
            {r.animals?.photo_url ? <img className="thumb" src={r.animals.photo_url} alt="" /> : <div className="thumb" />}
            <div className="grow">
              <b>{r.applicant_name}</b> quiere adoptar a <b>{r.animals?.name ?? "—"}</b>
              <span className={`tag ${r.status === "adoptado" ? "ok" : ""}`} style={{ marginLeft: ".5rem" }}>{ETIQUETA_ESTADO[r.status]}</span>
              <div className="muted">{sh?.name ?? "Sin refugio"} · {fechaCorta(r.created_at)} · {r.colonia}</div>
              {av.length > 0 && <div style={{ margin: ".4rem 0" }}>{av.map((t) => <span key={t} className="tag alerta">{t}</span>)}</div>}
              <p style={{ margin: ".4rem 0" }}>
                {VIVIENDA[r.housing]} ({r.tenure === "renta" ? "renta" : "propia"}) · {r.household_size} {r.household_size === 1 ? "persona" : "personas"} · niños: {r.has_kids ? "sí" : "no"} · otros animales: {r.has_pets ? `sí${r.pets_note ? ` (${r.pets_note})` : ""}` : "no"}
              </p>
              <details>
                <summary>Ver respuestas completas</summary>
                <p><b>Experiencia:</b> {r.experience ?? "—"}</p>
                <p><b>Cuando viaja o trabaja:</b> {r.away_plan ?? "—"}</p>
                <p><b>Por qué quiere adoptar:</b> {r.motivation}</p>
              </details>
              <div style={{ marginTop: ".4rem" }}>
                <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp de la persona</a>
                {" · "}
                {sh?.whatsapp
                  ? <a href={`https://wa.me/${sh.whatsapp}?text=${encodeURIComponent(resumenParaRefugio(r))}`} target="_blank" rel="noopener noreferrer">Enviar resumen al refugio</a>
                  : <span className="muted">El refugio no tiene WhatsApp registrado</span>}
              </div>
              <label style={{ marginTop: ".6rem" }}>Notas internas
                <textarea rows={2} defaultValue={r.admin_notes ?? ""} onBlur={(e) => guardarNota(r.id, e.target.value)} />
              </label>
            </div>
            <div className="row-actions" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <label>Etapa
                <select value={r.status} onChange={(e) => cambiarEstado(r, e.target.value as EstadoSolicitud)}>
                  {ESTADOS_SOLICITUD.map((s) => <option key={s} value={s}>{ETIQUETA_ESTADO[s]}</option>)}
                </select>
              </label>
              {r.status !== "adoptado" && ABIERTAS.includes(r.status) && <button className="btn alt" onClick={() => marcarAdoptado(r)}>Marcar adoptado</button>}
            </div>
          </div>
        );
      })}

      <h2 style={{ marginTop: "3rem" }}>Seguimientos post-adopción</h2>
      <p className="muted">Al marcar una adopción se programan seguimientos a 1, 3 y 6 meses. Tú los envías por WhatsApp y la familia responde en una página con foto.</p>
      <h3>Por enviar ({porEnviar.length})</h3>
      {porEnviar.length === 0 ? <p className="muted">Nada pendiente por enviar hoy.</p> : porEnviar.map((f) => filaSeg(f, "enviar"))}
      <h3 style={{ marginTop: "1.5rem" }}>Esperando respuesta ({esperando.length})</h3>
      {esperando.length === 0 ? <p className="muted">Ninguno.</p> : esperando.map((f) => filaSeg(f, "reenviar"))}
      <h3 style={{ marginTop: "1.5rem" }}>Respondidos ({respondidos.length})</h3>
      {respondidos.length === 0 ? <p className="muted">Aún no hay respuestas.</p> : respondidos.map((f) => filaSeg(f, "ver"))}
      <h3 style={{ marginTop: "1.5rem" }}>Programados ({programados.length})</h3>
      {programados.length === 0 ? <p className="muted">Ninguno.</p> : programados.map((f) => filaSeg(f, "ninguna"))}
    </>
  );
}
