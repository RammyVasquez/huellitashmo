"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/upload";
import { errTexto } from "@/lib/util";
import { useShelters } from "./useShelters";
import type { Animal } from "@/lib/types";

export default function AnimalsTab() {
  const { shelters, cargando } = useShelters();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [editing, setEditing] = useState<Animal | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    const { data } = await supabase.from("animals").select("*").order("created_at", { ascending: false });
    setAnimals((data ?? []) as Animal[]);
  }
  useEffect(() => { load(); }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setGuardando(true);
    setMsg(null);
    try {
      const file = fd.get("foto") as File;
      const photo_url = file && file.size > 0 ? await uploadPhoto(file, "animales") : editing?.photo_url ?? null;
      const status = String(fd.get("status"));
      const payload = {
        shelter_id: String(fd.get("shelter_id")) || null,
        name: String(fd.get("name")).trim(),
        species: fd.get("species"),
        sex: fd.get("sex") || null,
        age_text: String(fd.get("age_text")).trim() || null,
        description: String(fd.get("description")).trim() || null,
        photo_url,
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

  if (!cargando && shelters.length === 0)
    return <div className="empty">Primero registra un refugio en la pestaña “Refugios”.</div>;

  return (
    <>
      <h2>{editing ? `Editar a ${editing.name}` : "Registrar animal"}</h2>
      <form className="stack" key={`${formKey}-${shelters.length}`} onSubmit={onSubmit}>
        <label>Refugio
          <select name="shelter_id" defaultValue={editing?.shelter_id ?? shelters[0]?.id} required>
            {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
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
        <label>Foto {editing?.photo_url && <span className="muted">(ya tiene; sube otra para reemplazarla)</span>}
          <input name="foto" type="file" accept="image/*" />
        </label>
        <label>Estado
          <select name="status" defaultValue={editing?.status ?? "disponible"}>
            <option value="disponible">Disponible</option>
            <option value="en_proceso">Adopción en proceso</option>
            <option value="adoptado">Adoptado</option>
          </select>
        </label>
        <label className="check"><input type="checkbox" name="sterilized" defaultChecked={editing?.sterilized} /> Esterilizado</label>
        <label className="check"><input type="checkbox" name="vaccinated" defaultChecked={editing?.vaccinated} /> Vacunado</label>
        <label className="check"><input type="checkbox" name="sponsorable" defaultChecked={editing?.sponsorable} /> Se puede apadrinar</label>
        <label>Número de padrinos<input name="sponsors" type="number" min={0} defaultValue={editing?.sponsors ?? 0} /></label>
        <div className="actions" style={{ margin: 0 }}>
          <button className="btn" disabled={guardando}>{guardando ? "Guardando…" : editing ? "Guardar cambios" : "Registrar animal"}</button>
          {editing && <button type="button" className="btn ghost" onClick={() => { setEditing(null); setFormKey((k) => k + 1); }}>Cancelar</button>}
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
            <button className="btn ghost" onClick={() => { setEditing(a); setFormKey((k) => k + 1); window.scrollTo({ top: 0 }); }}>Editar</button>
            {a.status !== "adoptado" && <button className="btn alt" onClick={() => marcarAdoptado(a)}>Marcar adoptado</button>}
          </div>
        </div>
      ))}
    </>
  );
}
