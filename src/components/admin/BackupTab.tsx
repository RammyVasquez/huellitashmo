"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { errTexto } from "@/lib/util";

const TABLAS = ["shelters", "animals", "shelter_needs", "reports", "welfare_reports", "help_contacts", "adoption_requests", "adoption_followups"];
type Fila = Record<string, unknown>;

async function todo(tabla: string): Promise<Fila[]> {
  const filas: Fila[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.from(tabla).select("*").range(desde, desde + 999);
    if (error) throw error;
    filas.push(...((data ?? []) as Fila[]));
    if (!data || data.length < 1000) break;
  }
  return filas;
}

const dia = (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : "");

function csv(columnas: string[], filas: (string | number | boolean | null)[][]) {
  const esc = (v: string | number | boolean | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + [columnas, ...filas].map((f) => f.map(esc).join(",")).join("\n"); // BOM para que Excel lea acentos
}

function bajar(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const CLAVE_RESPALDO = "huellitas_ultimo_respaldo";

export default function BackupTab() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const hoy = new Date().toISOString().slice(0, 10);

  async function respaldo() {
    setTrabajando(true);
    setMsg(null);
    try {
      const tablas: Record<string, Fila[]> = {};
      const omitidas: string[] = [];
      for (const t of TABLAS) {
        try {
          const filas = await todo(t);
          if (t === "reports") filas.forEach((f) => delete f.embeddings); // se recalculan; pesan mucho
          tablas[t] = filas;
        } catch { omitidas.push(t); }
      }
      const total = Object.values(tablas).reduce((n, f) => n + f.length, 0);
      bajar(`respaldo-huellitas-${hoy}.json`, JSON.stringify({
        generado: new Date().toISOString(), version: 1,
        nota: "No incluye las fotos: viven en Supabase Storage (bucket fotos). Contiene datos personales: guárdalo en un lugar privado.",
        tablas,
      }, null, 2), "application/json");
      try { localStorage.setItem(CLAVE_RESPALDO, new Date().toISOString()); } catch { /* sin almacenamiento local */ }
      setMsg({ ok: true, text: `Respaldo descargado (${total} registros).${omitidas.length ? ` No se pudieron leer: ${omitidas.join(", ")}.` : ""}` });
    } catch (err) {
      setMsg({ ok: false, text: `No se pudo generar el respaldo: ${errTexto(err)}` });
    }
    setTrabajando(false);
  }

  async function metricas(cual: "casos" | "animales" | "adopciones") {
    setTrabajando(true);
    setMsg(null);
    try {
      const shelters = await todo("shelters");
      const refugio = (id: unknown) => String(shelters.find((s) => s.id === id)?.name ?? "");
      if (cual === "casos") {
        const [rep, wel] = await Promise.all([todo("reports"), todo("welfare_reports")]);
        const filas = [
          ...rep.map((r) => ["perdidos_encontrados", String(r.kind), String(r.species), String(r.zone ?? ""), String(r.status), "", dia(r.created_at), dia(r.resolved_at)]),
          ...wel.map((r) => ["rescate", String(r.category), String(r.species), String(r.zone ?? ""), String(r.status), r.urgent ? "sí" : "no", dia(r.created_at), dia(r.resolved_at)]),
        ];
        bajar(`casos-${hoy}.csv`, csv(["origen", "tipo", "especie", "zona", "estado", "urgente", "fecha_reporte", "fecha_resolucion"], filas), "text/csv");
      } else if (cual === "animales") {
        const an = await todo("animals");
        bajar(`animales-${hoy}.csv`, csv(["especie", "estado", "esterilizado", "vacunado", "refugio", "fecha_alta", "fecha_adopcion"],
          an.map((a) => [String(a.species), String(a.status), a.sterilized ? "sí" : "no", a.vaccinated ? "sí" : "no", refugio(a.shelter_id), dia(a.created_at), dia(a.adopted_at)])), "text/csv");
      } else {
        const [req, an] = await Promise.all([todo("adoption_requests"), todo("animals")]);
        const animal = (id: unknown) => an.find((a) => a.id === id);
        bajar(`adopciones-${hoy}.csv`, csv(["especie", "refugio", "estado_solicitud", "fecha_solicitud", "fecha_adopcion"],
          req.map((r) => [String(animal(r.animal_id)?.species ?? ""), refugio(animal(r.animal_id)?.shelter_id), String(r.status), dia(r.created_at), dia(r.adopted_at)])), "text/csv");
      }
      setMsg({ ok: true, text: "Archivo descargado." });
    } catch (err) {
      setMsg({ ok: false, text: `No se pudo generar el archivo: ${errTexto(err)}` });
    }
    setTrabajando(false);
  }

  return (
    <>
      <h2>Respaldo completo</h2>
      <p className="muted" style={{ maxWidth: "65ch" }}>
        Descarga todos los datos en un archivo. Hazlo una vez por semana: hasta donde sé, el plan gratuito de Supabase no incluye respaldos descargables.
        El archivo contiene teléfonos y otros datos personales, así que guárdalo en un lugar privado. No incluye las fotos.
      </p>
      <button className="btn" disabled={trabajando} onClick={respaldo}>{trabajando ? "Preparando…" : "Descargar respaldo (JSON)"}</button>

      <h2 style={{ marginTop: "2.5rem" }}>Métricas para tu expediente (Excel)</h2>
      <p className="muted" style={{ maxWidth: "65ch" }}>Tablas sin nombres ni teléfonos: solo fechas, tipos, zonas y resultados. Úsalas para tus cifras y gráficas.</p>
      <div className="actions">
        <button className="btn ghost" disabled={trabajando} onClick={() => metricas("casos")}>Casos (CSV)</button>
        <button className="btn ghost" disabled={trabajando} onClick={() => metricas("animales")}>Animales (CSV)</button>
        <button className="btn ghost" disabled={trabajando} onClick={() => metricas("adopciones")}>Adopciones (CSV)</button>
      </div>
      {msg && <p className={msg.ok ? "ok" : "error"} role="status">{msg.text}</p>}
    </>
  );
}
