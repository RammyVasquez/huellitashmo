"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/upload";
import { cleanSocial, errTexto, normalizeWa } from "@/lib/util";
import { useShelters } from "./useShelters";
import type { Shelter } from "@/lib/types";

function ShelterForm({ initial, onDone, onCancel }: { initial: Shelter | null; onDone: () => void; onCancel: () => void }) {
  const [lat, setLat] = useState(initial?.lat?.toString() ?? "");
  const [lng, setLng] = useState(initial?.lng?.toString() ?? "");
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

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
      const { error } = initial
        ? await supabase.from("shelters").update(payload).eq("id", initial.id)
        : await supabase.from("shelters").insert(payload);
      if (error) throw error;
      onDone();
    } catch (err) {
      setMsg({ ok: false, text: `No se pudo guardar: ${errTexto(err)}` });
    }
    setGuardando(false);
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label>Nombre del refugio<input name="name" defaultValue={initial?.name ?? ""} required /></label>
      <label>WhatsApp (10 dígitos; agregamos la lada de país)<input name="whatsapp" inputMode="numeric" defaultValue={initial?.whatsapp ?? ""} /></label>
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

export default function SheltersTab() {
  const { shelters, reload } = useShelters();
  const [editing, setEditing] = useState<Shelter | null>(null);
  const [formKey, setFormKey] = useState(0);
  const reset = () => { setEditing(null); setFormKey((k) => k + 1); };

  return (
    <>
      <h2>{editing ? `Editar ${editing.name}` : "Registrar refugio"}</h2>
      <ShelterForm key={formKey} initial={editing} onDone={() => { reset(); reload(); }} onCancel={reset} />

      <h2 style={{ marginTop: "2.5rem" }}>Refugios registrados ({shelters.length})</h2>
      {shelters.map((s) => (
        <div className="admin-row" key={s.id}>
          {s.logo_url ? <img className="thumb" src={s.logo_url} alt="" /> : <div className="thumb" />}
          <div className="grow">
            <b>{s.name}</b>
            <div className="muted">{s.address || "Sin dirección"}{s.lat == null && " · sin ubicación en el mapa"}</div>
          </div>
          <div className="row-actions">
            <button className="btn ghost" onClick={() => { setEditing(s); setFormKey((k) => k + 1); window.scrollTo({ top: 0 }); }}>Editar</button>
          </div>
        </div>
      ))}
    </>
  );
}
