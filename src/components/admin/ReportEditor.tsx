"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/upload";
import { errTexto, normalizeWa } from "@/lib/util";
import type { Pos } from "@/lib/geo";
import PhotoPicker from "../PhotoPicker";
import ZonePicker from "../ZonePicker";
import type { AdminReport } from "@/lib/types";

const MAX_FOTOS = 8;

// Edición completa de un reporte desde el panel: tipo, especie, texto, zona y mapa, detalle reservado, contacto y fotos
export default function ReportEditor({ report, onSaved, onCancel }: { report: AdminReport; onSaved: () => void; onCancel: () => void }) {
  const inicial = report.photos?.length ? report.photos : report.photo_url ? [report.photo_url] : [];
  const [kind, setKind] = useState(report.kind);
  const [species, setSpecies] = useState(report.species);
  const [descripcion, setDescripcion] = useState(report.description);
  const [zona, setZona] = useState(report.zone ?? "");
  const [loc, setLoc] = useState<Pos | null>(report.lat != null && report.lng != null ? { lat: report.lat, lng: report.lng } : null);
  const [privado, setPrivado] = useState(report.private_detail ?? "");
  const [wa, setWa] = useState(report.contact_whatsapp ? report.contact_whatsapp.replace(/^52/, "") : "");
  const [fotos, setFotos] = useState<string[]>(inicial);
  const [nuevas, setNuevas] = useState<File[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setMsg(null);
    try {
      if (descripcion.trim().length < 5) throw new Error("Escribe una descripción de al menos 5 caracteres.");
      if (!zona.trim()) throw new Error("Falta la zona.");
      const w = normalizeWa(wa);
      if (w && (w.length < 12 || w.length > 15)) throw new Error("El WhatsApp debe tener 10 dígitos, o déjalo vacío.");
      if (fotos.length + nuevas.length > MAX_FOTOS) throw new Error(`Máximo ${MAX_FOTOS} fotos.`);
      setGuardando(true);
      const subidas = await Promise.all(nuevas.map((f) => uploadPhoto(f, "reportes")));
      const lista = [...fotos, ...subidas];
      const cambioFotos = JSON.stringify(lista) !== JSON.stringify(inicial);
      const payload: Record<string, unknown> = {
        kind, species, description: descripcion.trim().slice(0, 1500), zone: zona.trim(),
        lat: loc?.lat ?? null, lng: loc?.lng ?? null,
        private_detail: privado.trim().slice(0, 300) || null,
        contact_whatsapp: w || null,
        photos: lista, photo_url: lista[0] ?? null,
      };
      if (cambioFotos) payload.embeddings = null; // las huellas visuales se recalculan con las fotos nuevas
      const { error } = await supabase.from("reports").update(payload).eq("id", report.id);
      if (error) throw error;
      onSaved();
    } catch (err) {
      setMsg({ ok: false, text: errTexto(err) });
    }
    setGuardando(false);
  }

  return (
    <div className="box stack" style={{ maxWidth: 680, marginTop: ".6rem" }}>
      <h3 style={{ margin: 0 }}>Editar reporte</h3>
      <div className="two">
        <label>Tipo
          <select value={kind} onChange={(e) => setKind(e.target.value as AdminReport["kind"])}>
            <option value="perdido">Perdido</option>
            <option value="encontrado">Encontrado</option>
          </select>
        </label>
        <label>Especie
          <select value={species} onChange={(e) => setSpecies(e.target.value as AdminReport["species"])}>
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
            <option value="otro">Otro</option>
          </select>
        </label>
      </div>
      <label>Descripción (color, tamaño, señas particulares…)
        <textarea rows={5} maxLength={1500} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </label>

      <div>
        <b>Fotos <span className="muted" style={{ fontWeight: 400 }}>(hasta {MAX_FOTOS}; la primera es la principal)</span></b>
        {fotos.length > 0 && (
          <div className="previews">
            {fotos.map((u, i) => (
              <div className="preview" key={u}>
                <img src={u} alt={`Foto ${i + 1}`} />
                {i === 0 && <span className="foto-tag">Principal</span>}
                {i > 0 && <button type="button" className="foto-principal" onClick={() => setFotos((f) => [f[i], ...f.filter((_, k) => k !== i)])}>Hacer principal</button>}
                <button type="button" className="preview-x" aria-label={`Quitar foto ${i + 1}`} onClick={() => setFotos((f) => f.filter((_, k) => k !== i))}>×</button>
              </div>
            ))}
          </div>
        )}
        <PhotoPicker max={Math.max(0, MAX_FOTOS - fotos.length)} onChange={setNuevas} />
      </div>

      <ZonePicker zona={zona} onZona={setZona} loc={loc} onLoc={setLoc} nota="Si cambias el punto del mapa, la ubicación pública se recalcula sola (aproximada en las encontradas)." />

      <label>Detalle reservado <span className="muted" style={{ fontWeight: 400 }}>(no se publica; sirve para confirmar al dueño)</span>
        <input maxLength={300} value={privado} onChange={(e) => setPrivado(e.target.value)} />
      </label>
      <label>WhatsApp de quien reportó <span className="muted" style={{ fontWeight: 400 }}>(opcional; no se publica)</span>
        <input inputMode="numeric" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="10 dígitos" />
      </label>

      {msg && <p className={msg.ok ? "ok" : "error"} role="alert">{msg.text}</p>}
      <div className="actions" style={{ margin: 0 }}>
        <button className="btn" disabled={guardando} onClick={guardar}>{guardando ? "Guardando…" : "Guardar cambios"}</button>
        <button className="btn ghost" disabled={guardando} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
