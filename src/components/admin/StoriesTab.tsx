"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/upload";
import { errTexto, fechaCorta } from "@/lib/util";
import PhotoPicker from "../PhotoPicker";
import { useShelters } from "./useShelters";
import type { Animal, Story } from "@/lib/types";

const MAX_FOTOS = 6;
type Listo = { id: string; photos: string[] | null; notes: string | null; adoption_requests: { animal_id: string; animals: { name: string; shelter_id: string | null } | null } | null };

function Editor({ inicial, shelterIdFijo, shelters, animals, onSaved, onCancel }: {
  inicial: Partial<Story>; shelterIdFijo?: string; shelters: { id: string; name: string }[]; animals: Pick<Animal, "id" | "name" | "shelter_id">[];
  onSaved: () => void; onCancel: () => void;
}) {
  const [shelter, setShelter] = useState(inicial.shelter_id ?? shelterIdFijo ?? "");
  const [animalId, setAnimalId] = useState(inicial.animal_id ?? "");
  const [titulo, setTitulo] = useState(inicial.title ?? "");
  const [texto, setTexto] = useState(inicial.body ?? "");
  const [familia, setFamilia] = useState(inicial.family_label ?? "");
  const [fotos, setFotos] = useState<string[]>(inicial.photos ?? []);
  const [nuevas, setNuevas] = useState<File[]>([]);
  const [permiso, setPermiso] = useState(inicial.consent_basis === "seguimiento");
  const [nota, setNota] = useState(inicial.consent_note ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const basis = inicial.consent_basis ?? "manual";

  async function guardar(publicar: boolean) {
    setMsg(null);
    try {
      if (!shelter) throw new Error("Elige el refugio.");
      if (titulo.trim().length < 3) throw new Error("Escribe un título.");
      if (texto.trim().length < 20) throw new Error("La historia debe tener al menos 20 caracteres.");
      if (fotos.length + nuevas.length > MAX_FOTOS) throw new Error(`Máximo ${MAX_FOTOS} fotos.`);
      if (publicar) {
        if (fotos.length + nuevas.length === 0) throw new Error("Para publicar necesitas al menos una foto.");
        if (basis === "manual" && (!permiso || nota.trim().length < 5)) throw new Error("Confirma que la familia autorizó y anota cómo lo autorizó (ej. “mensaje de WhatsApp del 5 de octubre”).");
      }
      setGuardando(true);
      const subidas = await Promise.all(nuevas.map((f) => uploadPhoto(f, "animales")));
      const payload = {
        shelter_id: shelter, animal_id: animalId || null, title: titulo.trim(), body: texto.trim(),
        family_label: familia.trim() || null, photos: [...fotos, ...subidas],
        consent_basis: basis, consent_note: nota.trim() || null,
        status: publicar ? "publicada" : inicial.status ?? "borrador",
        published_at: publicar ? inicial.published_at ?? new Date().toISOString() : inicial.published_at ?? null,
        ...(inicial.followup_id ? { followup_id: inicial.followup_id } : {}),
      };
      const { error } = inicial.id
        ? await supabase.from("stories").update(payload).eq("id", inicial.id)
        : await supabase.from("stories").insert(payload);
      if (error) throw error;
      onSaved();
    } catch (err) {
      setMsg({ ok: false, text: errTexto(err) });
    }
    setGuardando(false);
  }

  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <h2>{inicial.id ? "Editar historia" : "Nueva historia"}</h2>
      {!shelterIdFijo && (
        <label>Refugio
          <select value={shelter} onChange={(e) => { setShelter(e.target.value); setAnimalId(""); }}>
            <option value="">Elige un refugio</option>
            {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}
      <label>Animal (opcional)
        <select value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
          <option value="">Sin ligar a un animal</option>
          {animals.filter((a) => a.shelter_id === shelter).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <label>Título<input value={titulo} maxLength={100} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Canela ya duerme en su cama" /></label>
      <label>Su historia (2 o 3 párrafos cortos)<textarea rows={7} maxLength={1200} value={texto} onChange={(e) => setTexto(e.target.value)} /></label>
      <label>Cómo mencionar a la familia (opcional)
        <input value={familia} maxLength={60} onChange={(e) => setFamilia(e.target.value)} placeholder="Ej. Una familia de Hermosillo" />
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

      {basis === "seguimiento" ? (
        <p className="box">La familia autorizó el uso de estas fotos al responder su seguimiento. Revisa el texto con cuidado antes de publicar.</p>
      ) : (
        <>
          <label className="check"><input type="checkbox" checked={permiso} onChange={(e) => setPermiso(e.target.checked)} />
            Confirmo que la familia autorizó publicar esta historia y sus fotos.</label>
          <label>¿Cómo lo autorizó? (para tu registro, no se publica)
            <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. mensaje de WhatsApp del 5 de octubre" />
          </label>
        </>
      )}
      {msg && <p className={msg.ok ? "ok" : "error"} role="alert">{msg.text}</p>}
      <div className="actions" style={{ margin: 0 }}>
        <button className="btn" disabled={guardando} onClick={() => guardar(true)}>{guardando ? "Guardando…" : inicial.status === "publicada" ? "Guardar cambios" : "Guardar y publicar"}</button>
        {inicial.status !== "publicada" && <button className="btn ghost" disabled={guardando} onClick={() => guardar(false)}>Guardar borrador</button>}
        <button className="btn ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

export default function StoriesTab({ shelterId }: { shelterId?: string }) {
  const { shelters } = useShelters();
  const [stories, setStories] = useState<Story[]>([]);
  const [listos, setListos] = useState<Listo[]>([]);
  const [animals, setAnimals] = useState<Pick<Animal, "id" | "name" | "shelter_id">[]>([]);
  const [editando, setEditando] = useState<Partial<Story> | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    let q = supabase.from("stories").select("*").order("created_at", { ascending: false });
    if (shelterId) q = q.eq("shelter_id", shelterId);
    const s = await q;
    if (s.error) setMsg(`No se pudieron cargar las historias: ${errTexto(s.error)}`);
    const hist = (s.data ?? []) as Story[];
    setStories(hist);

    const f = await supabase.from("adoption_followups")
      .select("id, photos, notes, adoption_requests(animal_id, animals(name, shelter_id))")
      .eq("status", "respondido").eq("photo_consent", true);
    const usados = new Set(hist.map((h) => h.followup_id).filter(Boolean));
    setListos(((f.data ?? []) as unknown as Listo[]).filter((x) => (x.photos?.length ?? 0) > 0 && !usados.has(x.id) && (!shelterId || x.adoption_requests?.animals?.shelter_id === shelterId)));

    let qa = supabase.from("animals").select("id, name, shelter_id");
    if (shelterId) qa = qa.eq("shelter_id", shelterId);
    setAnimals(((await qa).data ?? []) as Pick<Animal, "id" | "name" | "shelter_id">[]);
  }, [shelterId]);
  useEffect(() => { load(); }, [load]);

  function desdeSeguimiento(f: Listo) {
    const an = f.adoption_requests?.animals;
    setEditando({
      shelter_id: an?.shelter_id ?? shelterId ?? undefined, animal_id: f.adoption_requests?.animal_id ?? null,
      followup_id: f.id, title: an ? `${an.name} ya tiene hogar` : "", body: f.notes ?? "", photos: f.photos ?? [], consent_basis: "seguimiento",
    });
  }

  async function cambiarEstado(h: Story, publicar: boolean) {
    const { error } = await supabase.from("stories").update({ status: publicar ? "publicada" : "borrador", published_at: publicar ? h.published_at ?? new Date().toISOString() : h.published_at }).eq("id", h.id);
    if (error) setMsg(errTexto(error)); else load();
  }

  async function eliminar(h: Story) {
    if (!confirm(`¿Eliminar la historia “${h.title}”? No se puede deshacer.`)) return;
    const { error } = await supabase.from("stories").delete().eq("id", h.id);
    if (error) setMsg(errTexto(error)); else load();
  }

  if (editando)
    return (
      <Editor
        key={editando.id ?? editando.followup_id ?? "nueva"}
        inicial={editando} shelterIdFijo={shelterId} shelters={shelterId ? shelters.filter((s) => s.id === shelterId) : shelters} animals={animals}
        onSaved={() => { setEditando(null); load(); }} onCancel={() => setEditando(null)}
      />
    );

  return (
    <>
      <p className="muted" style={{ maxWidth: "65ch" }}>
        Las historias “Encontró hogar” se publican en el sitio y se comparten muy bien en redes. <b>Solo publícalas con la autorización de la familia.</b>
      </p>
      <div className="actions" style={{ margin: "0 0 1rem" }}>
        <button className="btn" onClick={() => setEditando({ consent_basis: "manual", shelter_id: shelterId })}>Nueva historia</button>
      </div>
      {msg && <p className="error" role="alert">{msg}</p>}

      {listos.length > 0 && (
        <>
          <h2>Listas para convertir en historia ({listos.length})</h2>
          <p className="muted">Familias que respondieron su seguimiento con fotos y autorizaron usarlas.</p>
          {listos.map((f) => (
            <div className="admin-row" key={f.id}>
              <div className="thumbs">{(f.photos ?? []).slice(0, 3).map((u) => <img key={u} className="thumb" src={u} alt="" />)}</div>
              <div className="grow"><b>{f.adoption_requests?.animals?.name ?? "Animal"}</b>{f.notes && <div className="muted">{f.notes.slice(0, 120)}</div>}</div>
              <div className="row-actions"><button className="btn alt" onClick={() => desdeSeguimiento(f)}>Crear historia</button></div>
            </div>
          ))}
        </>
      )}

      <h2 style={{ marginTop: "2rem" }}>Historias ({stories.length})</h2>
      {stories.length === 0 && <div className="empty">Aún no hay historias.</div>}
      {stories.map((h) => (
        <div className="admin-row" key={h.id}>
          {h.photos?.[0] ? <img className="thumb" src={h.photos[0]} alt="" /> : <div className="thumb" />}
          <div className="grow">
            <b>{h.title}</b> <span className={`tag ${h.status === "publicada" ? "ok" : ""}`}>{h.status}</span>
            <div className="muted">{fechaCorta(h.created_at)} · permiso: {h.consent_basis === "seguimiento" ? "del seguimiento" : "manual"}</div>
          </div>
          <div className="row-actions">
            <button className="btn ghost" onClick={() => setEditando(h)}>Editar</button>
            <button className="btn ghost" onClick={() => cambiarEstado(h, h.status !== "publicada")}>{h.status === "publicada" ? "Despublicar" : "Publicar"}</button>
            <button className="btn ghost" onClick={() => eliminar(h)}>Eliminar</button>
          </div>
        </div>
      ))}
    </>
  );
}
