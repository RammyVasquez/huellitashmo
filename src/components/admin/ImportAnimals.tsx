"use client";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { errTexto } from "@/lib/util";
import { aPayload, interpretar, marcarDuplicados, MAX_FILAS, PLANTILLA_CSV, type FilaImport } from "@/lib/importar";
import type { Animal, Shelter } from "@/lib/types";

function bajar(nombre: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ImportAnimals({ shelters, shelterId, existentes, onDone }: {
  shelters: Shelter[]; shelterId?: string; existentes: Animal[]; onDone: () => void;
}) {
  const [refugio, setRefugio] = useState(shelterId ?? "");
  const [leidas, setLeidas] = useState<FilaImport[] | null>(null);
  const [ignoradas, setIgnoradas] = useState<string[]>([]);
  const [archivo, setArchivo] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [vuelta, setVuelta] = useState(0);

  const destino = shelterId ?? refugio;
  const filas = useMemo(
    () => (leidas ? marcarDuplicados(leidas, existentes.filter((a) => a.shelter_id === destino).map((a) => ({ name: a.name, species: a.species }))) : null),
    [leidas, existentes, destino]
  );
  const listas = filas?.filter((f) => !f.errores.length && !f.duplicado) ?? [];
  const conError = filas?.filter((f) => f.errores.length).length ?? 0;
  const repetidas = filas?.filter((f) => f.duplicado).length ?? 0;

  async function leer(file: File) {
    setMsg(null); setLeidas(null); setIgnoradas([]); setArchivo(file.name);
    try {
      if (file.size > 2_000_000) throw new Error("El archivo pesa más de 2 MB.");
      const ext = file.name.split(".").pop()?.toLowerCase();
      let rows: string[][];
      if (ext === "xlsx") {
        const { readSheet } = await import("read-excel-file/browser");
        const hoja = await readSheet(file); // primera hoja
        rows = hoja.map((r) => r.map((c) => (c == null ? "" : c instanceof Date ? c.toISOString().slice(0, 10) : String(c))));
      } else if (ext === "csv" || ext === "txt") {
        const Papa = (await import("papaparse")).default;
        const res = Papa.parse<string[]>((await file.text()).replace(/^\uFEFF/, ""), { skipEmptyLines: "greedy" });
        rows = res.data;
      } else {
        throw new Error("Formato no válido. Usa un archivo .xlsx o .csv (en Excel: Guardar como → CSV UTF-8).");
      }
      const r = interpretar(rows);
      if (r.falta) throw new Error(r.falta);
      setLeidas(r.filas);
      setIgnoradas(r.ignoradas);
    } catch (err) {
      setMsg({ ok: false, text: errTexto(err) });
    }
  }

  async function importar() {
    if (!destino) { setMsg({ ok: false, text: "Elige primero el refugio." }); return; }
    setTrabajando(true); setMsg(null);
    let hechos = 0;
    try {
      for (let i = 0; i < listas.length; i += 50) {
        const lote = listas.slice(i, i + 50).map((f) => aPayload(f, destino));
        const { error } = await supabase.from("animals").insert(lote);
        if (error) throw error;
        hechos += lote.length;
      }
      setMsg({ ok: true, text: `Listo: se importaron ${hechos} animales. Agrega sus fotos con “Editar” en la lista de abajo.` });
      setLeidas(null); setArchivo(""); setVuelta((v) => v + 1);
      onDone();
    } catch (err) {
      setMsg({ ok: false, text: `Se importaron ${hechos} y luego falló: ${errTexto(err)}` });
      if (hechos) onDone();
    }
    setTrabajando(false);
  }

  return (
    <details className="box">
      <summary><b>Importar varios animales desde Excel o CSV</b></summary>
      <p className="muted" style={{ marginTop: ".6rem", maxWidth: "65ch" }}>
        1) Descarga la plantilla y llénala (una fila por animal). 2) Súbela aquí y revisa la vista previa. 3) Importa. Máximo {MAX_FILAS} filas por vez.
        Las fotos no se importan: se agregan después con “Editar”.
      </p>
      <div className="actions" style={{ marginTop: 0 }}>
        <button type="button" className="btn ghost" onClick={() => bajar("plantilla-animales.csv", PLANTILLA_CSV)}>Descargar plantilla (CSV)</button>
      </div>
      {!shelterId && (
        <label style={{ maxWidth: 540 }}>Refugio al que pertenecen
          <select value={refugio} onChange={(e) => setRefugio(e.target.value)}>
            <option value="" disabled>Elige un refugio</option>
            {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}
      <label style={{ maxWidth: 540 }}>Archivo (.xlsx o .csv)
        <input key={vuelta} type="file" accept=".xlsx,.csv,.txt" onChange={(e) => { const f = e.target.files?.[0]; if (f) leer(f); }} />
      </label>
      {msg && <p className={msg.ok ? "ok" : "error"} role="status">{msg.text}</p>}

      {filas && (
        <>
          <p role="status">
            <b>{archivo}</b>: {listas.length} {listas.length === 1 ? "animal listo" : "animales listos"} para importar
            {conError > 0 && <> · <span className="error">{conError} con errores (se omiten)</span></>}
            {repetidas > 0 && <> · {repetidas} repetidos (se omiten)</>}.
          </p>
          {ignoradas.length > 0 && <p className="muted">Columnas que no se usaron: {ignoradas.join(", ")}.</p>}
          <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto" }}>
            <table className="tabla">
              <thead><tr><th>Fila</th><th>Nombre</th><th>Especie</th><th>Edad</th><th>Estado</th></tr></thead>
              <tbody>
                {filas.slice(0, 150).map((f) => (
                  <tr key={f.fila}>
                    <td>{f.fila}</td><td>{f.nombre || "—"}</td><td>{f.species ?? "—"}</td><td>{f.age_text ?? f.age_group ?? "—"}</td>
                    <td>
                      {f.errores.length > 0 ? <span className="error">{f.errores.join("; ")}</span>
                        : f.duplicado ? <span className="muted">{f.duplicado}</span>
                        : f.avisos.length > 0 ? <span>OK · <span className="muted">{f.avisos.join("; ")}</span></span>
                        : "OK"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filas.length > 150 && <p className="muted">Se muestran las primeras 150 filas; se importarán todas las que estén listas.</p>}
          <div className="actions">
            <button className="btn" disabled={trabajando || listas.length === 0 || !destino} onClick={importar}>
              {trabajando ? "Importando…" : `Importar ${listas.length} ${listas.length === 1 ? "animal" : "animales"}`}
            </button>
            <button type="button" className="btn ghost" onClick={() => { setLeidas(null); setArchivo(""); setVuelta((v) => v + 1); }}>Cancelar</button>
          </div>
        </>
      )}
    </details>
  );
}
