"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/upload";
import { cleanSocial, errTexto, normalizeWa } from "@/lib/util";
import { useShelters } from "./useShelters";
import { TIPOS, type TipoRefugio } from "@/lib/refugios";
import type { Shelter } from "@/lib/types";

function ShelterForm({ initial, onDone, onCancel }: { initial: Shelter | null; onDone: () => void; onCancel: () => void }) {
  const [lat, setLat] = useState(initial?.lat?.toString() ?? "");
  const [lng, setLng] = useState(initial?.lng?.toString() ?? "");
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [correo, setCorreo] = useState("");

  useEffect(() => {
    if (!initial?.id) return;
    supabase.from("shelter_private").select("notify_email").eq("shelter_id", initial.id).maybeSingle()
      .then(({ data }) => setCorreo(data?.notify_email ?? ""));
  }, [initial?.id]);

  function usarMiUbicacion() {
    navigator.geolocation.getCurrentPosition(
      (p) => { setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6)); },
      () => setMsg({ ok: false, text: "No pudimos obtener la ubicación. Escríbela a mano." })
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setGuardando(true);
    setMsg(null);
    try {
      const file = fd.get("logo") as File;
      const logo_url = file && file.size > 0 ? await uploadPhoto(file, "logos") : initial?.logo_url ?? null;
      const payload = {
        name: String(fd.get("name")).trim(),
        kind: String(fd.get("kind")) || "refugio",
        whatsapp: normalizeWa(String(fd.get("whatsapp"))),
        address: String(fd.get("address")).trim() || null,
        drop_off_hours: String(fd.get("drop_off_hours")).trim() || null,
        about: String(fd.get("about")).trim() || null,
        lat: lat.trim() ? Number(lat) : null,
        lng: lng.trim() ? Number(lng) : null,
        facebook_url: cleanSocial(String(fd.get("facebook_url")), ["facebook.com", "fb.com"]),
        instagram_url: cleanSocial(String(fd.get("instagram_url")), ["instagram.com"]),
        logo_url,
      };
      if ((payload.lat != null && Number.isNaN(payload.lat)) || (payload.lng != null && Number.isNaN(payload.lng)))
        throw new Error("Latitud y longitud deben ser números (ej. 29.0892 y -110.9613).");
      const email = correo.trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("El correo para avisos no es válido.");
      let id = initial?.id;
      if (initial) {
        const { error } = await supabase.from("shelters").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("shelters").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      const { error: e2 } = await supabase.from("shelter_private").upsert({ shelter_id: id, notify_email: email || null, updated_at: new Date().toISOString() });
      if (e2) throw e2;
      onDone();
    } catch (err) {
      setMsg({ ok: false, text: `No se pudo guardar: ${errTexto(err)}` });
    }
    setGuardando(false);
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label>Tipo
        <select name="kind" defaultValue={initial?.kind ?? "refugio"}>
          {(Object.keys(TIPOS) as TipoRefugio[]).map((k) => <option key={k} value={k}>{TIPOS[k]}</option>)}
        </select>
      </label>
      <label>Nombre (del refugio, hogar temporal, rescatista o colectivo)<input name="name" defaultValue={initial?.name ?? ""} required /></label>
      <label>WhatsApp (10 dígitos; agregamos la lada de país)<input name="whatsapp" inputMode="numeric" defaultValue={initial?.whatsapp ?? ""} /></label>
      <label>Correo para avisos (privado: no se publica)
        <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="correo@ejemplo.com" autoComplete="off" />
      </label>
      <p className="muted" style={{ margin: "-.4rem 0 0", fontSize: ".92rem" }}>Te avisamos aquí cuando llegue una solicitud de adopción o respondan un seguimiento.</p>
      <label>Sobre el refugio (1 o 2 frases)<textarea name="about" rows={3} defaultValue={initial?.about ?? ""} /></label>
      <label>Dirección donde reciben donativos<input name="address" defaultValue={initial?.address ?? ""} /></label>
      <label>Horario de recepción<input name="drop_off_hours" placeholder="Sábados y domingos de 10:00 a 14:00" defaultValue={initial?.drop_off_hours ?? ""} /></label>
      <label>Página de Facebook (enlace)<input name="facebook_url" inputMode="url" placeholder="https://www.facebook.com/tu-refugio" defaultValue={initial?.facebook_url ?? ""} /></label>
      <label>Instagram (enlace)<input name="instagram_url" inputMode="url" placeholder="https://www.instagram.com/tu-refugio" defaultValue={initial?.instagram_url ?? ""} /></label>
      <div className="two">
        <label>Latitud<input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" placeholder="29.0892" /></label>
        <label>Longitud<input value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" placeholder="-110.9613" /></label>
      </div>
      <button type="button" className="btn ghost" onClick={usarMiUbicacion}>Usar mi ubicación actual (estando en el refugio)</button>
      <label>Logo {initial?.logo_url && <span className="muted">(ya tiene; sube otro para reemplazarlo)</span>}
        <input name="logo" type="file" accept="image/*" />
      </label>
      <div className="actions" style={{ margin: 0 }}>
        <button className="btn" disabled={guardando}>{guardando ? "Guardando…" : initial ? "Guardar cambios" : "Registrar refugio"}</button>
        {initial && <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>}
      </div>
      {msg && <p className={msg.ok ? "ok" : "error"} role="alert">{msg.text}</p>}
    </form>
  );
}

export default function SheltersTab({ soloId }: { soloId?: string } = {}) {
  const { shelters, reload } = useShelters();
  const [editing, setEditing] = useState<Shelter | null>(null);
  const [formKey, setFormKey] = useState(0);
  const reset = () => { setEditing(null); setFormKey((k) => k + 1); };
  const [guardado, setGuardado] = useState(false);
  const [aviso, setAviso] = useState("");
  async function verificar(sh: Shelter, valor: boolean) {
    if (valor && !confirm(`¿Confirmas que comprobaste quién es “${sh.name}” y que realiza labores de rescate o cuidado de animales en Hermosillo? Aparecerá el sello “Verificado” en su perfil público.`)) return;
    setAviso("");
    const { error } = await supabase.from("shelters").update({ verified_at: valor ? new Date().toISOString() : null }).eq("id", sh.id);
    if (error) setAviso(`No se pudo cambiar la verificación: ${errTexto(error)}`); else reload();
  }
  const propio = soloId ? shelters.find((x) => x.id === soloId) ?? null : null;

  // Personal de refugio: solo edita el perfil de su propio refugio
  if (soloId) {
    return propio ? (
      <>
        <h2>Mi refugio</h2>
        <p className="muted">Estos datos se muestran en tu perfil público.</p>
        <ShelterForm key={formKey} initial={propio} onDone={() => { setFormKey((k) => k + 1); setGuardado(true); reload(); }} onCancel={() => setFormKey((k) => k + 1)} />
        {guardado && <p className="ok" role="status">Cambios guardados.</p>}
      </>
    ) : <p className="muted">Cargando…</p>;
  }

  return (
    <>
      <h2>{editing ? `Editar ${editing.name}` : "Registrar refugio"}</h2>
      <ShelterForm key={formKey} initial={editing} onDone={() => { reset(); reload(); }} onCancel={reset} />

      <h2 style={{ marginTop: "2.5rem" }}>Refugios registrados ({shelters.length})</h2>
      {aviso && <p className="error" role="alert">{aviso}</p>}
      {shelters.map((s) => (
        <div className="admin-row" key={s.id}>
          {s.logo_url ? <img className="thumb" src={s.logo_url} alt="" /> : <div className="thumb" />}
          <div className="grow">
            <b>{s.name}</b>
            <div>
              <span className="tag">{TIPOS[(s.kind ?? "refugio") as TipoRefugio]}</span>
              {s.verified_at ? <span className="tag ok">Verificado</span> : <span className="tag">Sin verificar</span>}
            </div>
            <div className="muted">{s.address || "Sin dirección"}{s.lat == null && " · sin ubicación en el mapa"}</div>
          </div>
          <div className="row-actions">
            <button className="btn ghost" onClick={() => { setEditing(s); setFormKey((k) => k + 1); window.scrollTo({ top: 0 }); }}>Editar</button>
            <button className="btn ghost" onClick={() => verificar(s, !s.verified_at)}>{s.verified_at ? "Quitar verificación" : "Verificar"}</button>
          </div>
        </div>
      ))}
    </>
  );
}
