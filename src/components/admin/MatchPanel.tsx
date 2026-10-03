"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { enComun } from "@/lib/buscar";
import { cargarModelo, similitud, vectorDeFoto } from "@/lib/clip";
import { km, fmtKm } from "@/lib/geo";
import { errTexto, fechaCorta } from "@/lib/util";
import type { AdminReport } from "@/lib/types";

type Vectores = number[][];
type Candidato = { r: AdminReport; sim: number };

const fotosDe = (r: AdminReport) => (r.photos?.length ? r.photos : r.photo_url ? [r.photo_url] : []).slice(0, 5);
// Umbrales provisionales: en una prueba, un perro y un gato distintos dieron 0.73
const nivel = (s: number) => (s >= 0.9 ? "Muy parecido" : s >= 0.83 ? "Parecido" : s >= 0.76 ? "Algo parecido" : "Poco parecido");

export default function MatchPanel({ report, todos, onDone }: { report: AdminReport; todos: AdminReport[]; onDone: () => void }) {
  const [fase, setFase] = useState<"idle" | "trabajando" | "listo" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [resultados, setResultados] = useState<Candidato[]>([]);

  const opuesto = report.kind === "perdido" ? "encontrado" : "perdido";
  const candidatos = todos.filter(
    (r) => r.id !== report.id && r.kind === opuesto && r.species === report.species && (r.status === "pendiente" || r.status === "activo")
  );

  async function buscar() {
    setFase("trabajando");
    setResultados([]);
    try {
      if (fotosDe(report).length === 0) throw new Error("Este reporte no tiene fotos para comparar.");
      const conFotos = candidatos.filter((c) => fotosDe(c).length > 0);
      if (conFotos.length === 0) throw new Error(`No hay reportes de mascotas ${opuesto}s con foto para comparar.`);

      const ids = [report.id, ...conFotos.map((c) => c.id)];
      const { data, error } = await supabase.from("reports").select("id, embeddings").in("id", ids);
      if (error) throw error;
      const guardados = new Map<string, Vectores | null>((data ?? []).map((d: { id: string; embeddings: Vectores | null }) => [d.id, d.embeddings]));

      // Analizar solo las fotos que aún no tienen huella visual
      const pendientes = [report, ...conFotos].filter((r) => !guardados.get(r.id)?.length);
      if (pendientes.length) {
        setMsg("Preparando el modelo… la primera vez descarga unos 90 MB y se guarda en el navegador.");
        await cargarModelo((pct) => setMsg(`Descargando el modelo… ${pct}%`));
        const total = pendientes.reduce((n, r) => n + fotosDe(r).length, 0);
        let hechas = 0;
        for (const r of pendientes) {
          const vs: Vectores = [];
          for (const url of fotosDe(r)) {
            setMsg(`Analizando fotos… ${++hechas} de ${total}`);
            vs.push(await vectorDeFoto(url));
          }
          const { error: e2 } = await supabase.from("reports").update({ embeddings: vs }).eq("id", r.id);
          if (e2) throw e2;
          guardados.set(r.id, vs);
        }
      }

      const base = guardados.get(report.id) ?? [];
      const lista: Candidato[] = conFotos
        .map((c) => {
          const vs = guardados.get(c.id) ?? [];
          let max = -1;
          for (const a of base) for (const b of vs) max = Math.max(max, similitud(a, b));
          return { r: c, sim: max };
        })
        .filter((x) => x.sim > -1)
        .sort((x, y) => y.sim - x.sim)
        .slice(0, 5);
      setResultados(lista);
      setFase("listo");
      setMsg("");
    } catch (err) {
      console.error(err);
      setFase("error");
      setMsg(errTexto(err));
    }
  }

  async function reunir(c: AdminReport) {
    if (!confirm("¿Confirmas que estos dos reportes son la misma mascota y ya se reunió con su familia? Los dos se marcarán como reunificados y contarán en tu estadística.")) return;
    const ahora = new Date().toISOString();
    const { error } = await supabase.from("reports").update({ status: "reunificado", resolved_at: ahora }).in("id", [report.id, c.id]);
    if (error) { setFase("error"); setMsg(errTexto(error)); return; }
    onDone();
  }

  return (
    <div className="box match-panel">
      <h3 style={{ marginTop: 0 }}>Posibles coincidencias</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        Compara las fotos de este reporte con las de mascotas {opuesto}s de la misma especie ({candidatos.length} por revisar).
        Es solo una sugerencia visual: confirma siempre hablando con las dos personas.
      </p>
      {fase !== "trabajando" && <button className="btn alt" onClick={buscar}>{fase === "listo" ? "Buscar de nuevo" : "Buscar coincidencias"}</button>}
      {fase === "trabajando" && <p role="status" aria-live="polite"><b>{msg || "Trabajando…"}</b></p>}
      {fase === "error" && <p className="error" role="alert">No se pudo completar: {msg}</p>}
      {fase === "listo" && resultados.length === 0 && <p>No encontramos candidatos con foto.</p>}

      {resultados.map(({ r: c, sim }) => {
        const dist = report.lat != null && report.lng != null && c.lat != null && c.lng != null
          ? km({ lat: report.lat, lng: report.lng }, { lat: c.lat, lng: c.lng }) : null;
        const foto = fotosDe(c)[0];
        return (
          <div className="admin-row" key={c.id}>
            {foto ? <img className="thumb" src={foto} alt="Foto del candidato" /> : <div className="thumb" />}
            <div className="grow">
              <span className={`tag ${sim >= 0.9 ? "ok" : ""}`}>{nivel(sim)}</span>
              <span className={`tag ${c.kind}`}>{c.kind}</span>
              <span className="muted"> {c.zone} · {fechaCorta(c.created_at)}{dist != null && ` · a ${fmtKm(dist)} de este reporte`}</span>
              <p style={{ margin: ".3rem 0" }}>{c.description}</p>
              <small className="muted">
                Similitud visual: {sim.toFixed(2)}
                {enComun(report.description, c.description).length > 0 && ` · En común en la descripción: ${enComun(report.description, c.description).join(", ")}`}
              </small>
              <div>
                <a href={`https://wa.me/${report.contact_whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp de este reporte</a>{" · "}
                <a href={`https://wa.me/${c.contact_whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp del candidato</a>
              </div>
            </div>
            <div className="row-actions">
              <button className="btn ghost" onClick={() => reunir(c)}>Confirmar: son la misma</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
