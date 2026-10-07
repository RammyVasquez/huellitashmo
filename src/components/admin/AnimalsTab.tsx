"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/upload";
import { errTexto } from "@/lib/util";
import PhotoPicker from "../PhotoPicker";
import ImportAnimals from "./ImportAnimals";
import { useShelters } from "./useShelters";
import type { Animal } from "@/lib/types";

const MAX_FOTOS = 8;
const fotosDe = (a: Animal | null) => (a ? (a.photos?.length ? a.photos : a.photo_url ? [a.photo_url] : []) : []);

export default function AnimalsTab({ shelterId }: { shelterId?: string } = {}) {
  const { shelters, cargando } = useShelters();
  const visibles = shelterId ? shelters.filter((s) => s.id === shelterId) : shelters;
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [editing, setEditing] = useState<Animal | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [fotos, setFotos] = useState<string[]>([]);   // fotos que ya tiene (se pueden quitar o cambiar de orden)
  const [nuevas, setNuevas] = useState<File[]>([]);     // fotos nuevas por subir
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    let q = supabase.from("animals").select("*").order("created_at", { ascending: false });
    if (shelterId) q = q.eq("shelter_id", shelterId);
    const { data } = await q;
    setAnimals((data ?? []) as Animal[]);
  }
  useEffect(() => { load(); }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setGuardando(true);
    setMsg(null);
    try {
      if (fotos.length + nuevas.length > MAX_FOTOS) throw new Error(`Máximo ${MAX_FOTOS} fotos por animal.`);
      const subidas = await Promise.all(nuevas.map((f) => uploadPhoto(f, "animales")));
      const lista = [...fotos, ...subidas];
      const status = String(fd.get("status"));
      const payload = {
        shelter_id: String(fd.get("shelter_id")) || null,
        name: String(fd.get("name")).trim(),
        species: fd.get("species"),
        sex: fd.get("sex") || null,
        age_text: String(fd.get("age_text")).trim() || null,
        description: String(fd.get("description")).trim() || null,
        photo_url: lista[0] ?? null,
        photos: lista,
        age_group: String(fd.get("age_group")) || null,
        size: String(fd.get("size")) || null,
        energy: String(fd.get("energy")) || null,
        good_kids: String(fd.get("good_kids")) || null,
        good_pets: String(fd.get("good_pets")) || null,
        status,
        sterilized: fd.get("sterilized") === "on",
        vaccinated: fd.get("vaccinated") === "on",
        sponsorable: fd.get("sponsorable") === "on",
        sponsors: Number(fd.get("sponsors") || 0),
        adopted_at: status === "adoptado" ? editing?.status === "adoptado" ? undefined : new Date().toISOString() : null,
      };
      const q = editing
        ? supabase.from("animals").update(payload).eq("id", editing.id)
        : supabase.from("animals").insert(payload);
      const { error } = await q;
      if (error) throw error;
      setMsg({ ok: true, text: editing ? "Cambios guardados." : "Animal registrado." });
      setEditing(null);
      setFotos([]);
      setNuevas([]);
      setFormKey((k) => k + 1);
      load();
    } catch (err) {
      setMsg({ ok: false, text: `No se pudo guardar: ${errTexto(err)}` });
    }
    setGuardando(false);
  }

  async function marcarAdoptado(a: Animal) {
    const { error } = await supabase.from("animals").update({ status: "adoptado", adopted_at: new Date().toISOString() }).eq("id", a.id);
    if (error) setMsg({ ok: false, text: errTexto(error) });
    else load();
  }

  if (!cargando && visibles.length === 0)
    return <div className="empty">Primero registra un refugio en la pestaña “Refugios”.</div>;

  return (
    <>
      {!editing && <ImportAnimals shelters={visibles} shelterId={shelterId} existentes={animals} onDone={load} />}
      <h2>{editing ? `Editar a ${editing.name}` : "Registrar animal"}</h2>
      {editing && <p className="box" role="status">Estás editando a <b>{editing.name}</b>. Cambia lo que necesites y pulsa “Guardar cambios”.</p>}
      <form className="stack" key={`${formKey}-${shelters.length}`} onSubmit={onSubmit}>
        {shelterId ? <input type="hidden" name="shelter_id" value={shelterId} /> : (
          <label>Refugio
            <select name="shelter_id" defaultValue={editing?.shelter_id ?? visibles[0]?.id} required>
              {visibles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}
        <label>Nombre<input name="name" defaultValue={editing?.name ?? ""} required /></label>
        <div className="two">
          <label>Especie
            <select name="species" defaultValue={editing?.species ?? "perro"}>
              <option value="perro">Perro</option><option value="gato">Gato</option><option value="otro">Otro</option>
            </select>
          </label>
          <label>Sexo
            <select name="sex" defaultValue={editing?.sex ?? ""}>
              <option value="">No especificado</option><option value="macho">Macho</option><option value="hembra">Hembra</option>
            </select>
          </label>
        </div>
        <label>Edad (ej. “2 años”, “cachorro”)<input name="age_text" defaultValue={editing?.age_text ?? ""} /></label>
        <p className="muted" style={{ margin: 0 }}>Su carácter ayuda a recomendarlo a la familia correcta. Si no lo sabes, déjalo en “Sin dato”.</p>
        <div className="two">
          <label>Grupo de edad
            <select name="age_group" defaultValue={editing?.age_group ?? ""}>
              <option value="">Sin dato</option><option value="cachorro">Cachorro (menos de 1 año)</option><option value="joven">Joven (1 a 3 años)</option><option value="adulto">Adulto (3 a 8 años)</option><option value="senior">Senior (más de 8 años)</option>
            </select>
          </label>
          <label>Tamaño
            <select name="size" defaultValue={editing?.size ?? ""}>
              <option value="">Sin dato</option><option value="pequeno">Pequeño</option><option value="mediano">Mediano</option><option value="grande">Grande</option>
            </select>
          </label>
        </div>
        <label>Nivel de energía
          <select name="energy" defaultValue={editing?.energy ?? ""}>
            <option value="">Sin dato</option><option value="tranquilo">Tranquilo</option><option value="moderado">Moderado</option><option value="activo">Muy activo</option>
          </select>
        </label>
        <div className="two">
          <label>¿Se lleva bien con niños?
            <select name="good_kids" defaultValue={editing?.good_kids ?? ""}>
              <option value="">Sin dato</option><option value="si">Sí</option><option value="no">No / mejor sin niños</option>
            </select>
          </label>
          <label>¿Se lleva bien con otros animales?
            <select name="good_pets" defaultValue={editing?.good_pets ?? ""}>
              <option value="">Sin dato</option><option value="si">Sí</option><option value="no">No / mejor solo</option>
            </select>
          </label>
        </div>
        <label>Su historia y carácter<textarea name="description" rows={4} defaultValue={editing?.description ?? ""} /></label>
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
          <PhotoPicker key={formKey} max={Math.max(0, MAX_FOTOS - fotos.length)} onChange={setNuevas} />
        </div>
        <label>Estado
          <select name="status" defaultValue={editing?.status ?? "disponible"}>
            <option value="disponible">Disponible</option>
            <option value="en_proceso">Adopción en proceso</option>
            <option value="adoptado">Adoptado</option>
          </select>
        </label>
        <label className="check"><input type="checkbox" name="sterilized" defaultChecked={editing?.sterilized} /> Esterilizado o castrado</label>
        <label className="check"><input type="checkbox" name="vaccinated" defaultChecked={editing?.vaccinated} /> Vacunado</label>
        <label className="check"><input type="checkbox" name="sponsorable" defaultChecked={editing?.sponsorable} /> Se puede apadrinar</label>
        <label>Número de padrinos<input name="sponsors" type="number" min={0} defaultValue={editing?.sponsors ?? 0} /></label>
        <div className="actions" style={{ margin: 0 }}>
          <button className="btn" disabled={guardando}>{guardando ? "Guardando…" : editing ? "Guardar cambios" : "Registrar animal"}</button>
          {editing && <button type="button" className="btn ghost" onClick={() => { setEditing(null); setFotos([]); setNuevas([]); setFormKey((k) => k + 1); }}>Cancelar</button>}
        </div>
        {msg && <p className={msg.ok ? "ok" : "error"} role="status">{msg.text}</p>}
      </form>

      <h2 style={{ marginTop: "2.5rem" }}>Animales registrados ({animals.length})</h2>
      {animals.length === 0 && <div className="empty">Aún no hay animales.</div>}
      {animals.map((a) => (
        <div className="admin-row" key={a.id}>
          {a.photo_url ? <img className="thumb" src={a.photo_url} alt="" /> : <div className="thumb" />}
          <div className="grow">
            <b>{a.name}</b> <span className="tag">{a.species}</span><span className="tag">{a.status.replace("_", " ")}</span>
            {a.sponsorable && <span className="tag">apadrinable · {a.sponsors}</span>}
          </div>
          <div className="row-actions">
            <a className="btn ghost" href={`/animales/${a.id}/kit`} target="_blank" rel="noopener noreferrer">Kit para compartir</a>
            <button className="btn ghost" onClick={() => { setEditing(a); setFotos(fotosDe(a)); setNuevas([]); setFormKey((k) => k + 1); window.scrollTo({ top: 0 }); }}>Editar</button>
            {a.status !== "adoptado" && <button className="btn alt" onClick={() => marcarAdoptado(a)}>Marcar adoptado</button>}
          </div>
        </div>
      ))}
    </>
  );
}
