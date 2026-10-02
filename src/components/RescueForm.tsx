"use client";
import Link from "next/link";
import { useState } from "react";
import { comprimirImagen } from "@/lib/upload";
import { errTexto, normalizeWa } from "@/lib/util";
import type { Pos } from "@/lib/geo";
import { CATEGORIAS, type HelpContact, type WelfareCategory } from "@/lib/types";
import HelpContacts from "./HelpContacts";
import PhotoPicker from "./PhotoPicker";
import Turnstile, { CAPTCHA_ACTIVO } from "./Turnstile";
import ZonePicker from "./ZonePicker";

type Species = "perro" | "gato" | "otro";

function Opcion({ activo, onClick, titulo, texto, name }: { activo: boolean; onClick: () => void; titulo: string; texto?: string; name: string }) {
  return (
    <label className={`choice${activo ? " on" : ""}`}>
      <input type="radio" name={name} checked={activo} onChange={onClick} />
      <strong>{titulo}</strong>
      {texto && <span>{texto}</span>}
    </label>
  );
}

export default function RescueForm({ contacts }: { contacts: HelpContact[] }) {
  const [category, setCategory] = useState<WelfareCategory>("atropellado_herido");
  const [species, setSpecies] = useState<Species>("perro");
  const [urgent, setUrgent] = useState(false);
  const [zona, setZona] = useState("");
  const [loc, setLoc] = useState<Pos | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [allow, setAllow] = useState(false);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [mensaje, setMensaje] = useState("");
  const [vuelta, setVuelta] = useState(0);
  const [token, setToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const publica = CATEGORIAS[category].publica;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const descripcion = String(fd.get("description")).trim();
    const rawWa = String(fd.get("whatsapp")).trim();
    const wa = rawWa ? normalizeWa(rawWa) : null;
    if (descripcion.length < 10) { setEstado("error"); setMensaje("Cuéntanos un poco más: qué viste y cómo se encuentra el animal."); return; }
    if (rawWa && (!wa || wa.length < 12)) { setEstado("error"); setMensaje("Tu WhatsApp debe tener 10 dígitos (o déjalo vacío para reportar sin datos)."); return; }
    if (CAPTCHA_ACTIVO && !token) { setEstado("error"); setMensaje("Completa la verificación de seguridad."); return; }
    setEstado("enviando");
    setMensaje(files.length ? "Subiendo fotos…" : "");
    try {
      const body = new FormData();
      body.set("category", category);
      body.set("species", species);
      body.set("urgent", urgent ? "1" : "0");
      body.set("description", descripcion);
      body.set("zone", zona.trim());
      if (loc) { body.set("lat", String(loc.lat)); body.set("lng", String(loc.lng)); }
      if (wa) body.set("whatsapp", wa);
      body.set("allow", publica && !!wa && allow ? "1" : "0");
      body.set("token", token);
      body.set("website", String(fd.get("website") ?? ""));
      const blobs = await Promise.all(files.map((f) => comprimirImagen(f, 1400, "image/jpeg")));
      if (blobs.reduce((n, b) => n + b.size, 0) > 4_000_000) throw new Error("Las fotos pesan demasiado. Quita alguna e intenta de nuevo.");
      blobs.forEach((b, i) => body.append("fotos", b, `foto-${i + 1}.jpg`));
      const res = await fetch("/api/rescate", { method: "POST", body });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error ?? "No pudimos enviar el reporte.");
      setEstado("ok");
    } catch (err) {
      console.error(err);
      setEstado("error");
      setMensaje(`No pudimos enviar tu reporte: ${errTexto(err)}`);
      setToken("");
      setCaptchaKey((k) => k + 1);
    }
  }

  function reiniciar() {
    setCategory("atropellado_herido"); setSpecies("perro"); setUrgent(false); setZona(""); setLoc(null);
    setFiles([]); setAllow(false); setMensaje(""); setEstado("idle"); setVuelta((v) => v + 1);
  }

  if (estado === "ok")
    return (
      <div className="form-card success" role="status">
        <h2>Gracias por avisar</h2>
        <p className="lead">
          {publica
            ? "Revisaremos tu reporte y, si procede, lo publicaremos (sin tu número) para que la comunidad pueda ayudar."
            : "Tu reporte no se publica: lo revisa nuestro equipo y lo canaliza con quien pueda ayudar."}
        </p>
        {urgent && <p className="alertbox"><b>Esta plataforma no es un servicio de emergencia.</b> Si el animal está grave, no esperes: busca ahora un veterinario o a la autoridad local.</p>}
        <HelpContacts contacts={contacts} />
        <div className="actions">
          <Link className="btn" href="/rescate">Ver casos que necesitan ayuda</Link>
          <button className="btn ghost" onClick={reiniciar}>Hacer otro reporte</button>
        </div>
      </div>
    );

  return (
    <form className="form-card" onSubmit={onSubmit} key={vuelta}>
      <section className="fs">
        <h2><span className="num">1</span> ¿Qué viste?</h2>
        <div className="choices" role="radiogroup" aria-label="Qué viste">
          {(Object.keys(CATEGORIAS) as WelfareCategory[]).map((c) => (
            <Opcion key={c} name="category" activo={category === c} onClick={() => setCategory(c)} titulo={CATEGORIAS[c].titulo} texto={CATEGORIAS[c].texto} />
          ))}
        </div>
        <p className="box" style={{ margin: 0 }}>
          {publica
            ? "Este tipo de reporte se publica en la página de Rescate, después de revisarlo, para que la comunidad ayude. Tu número no se muestra."
            : "Este tipo de reporte NO se publica. Lo ve solo nuestro equipo, que lo canaliza con quien pueda ayudar. Si quieres hacer una denuncia formal, preséntala ante las autoridades."}
        </p>
        <label className="check">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          Está en peligro ahora o necesita ayuda urgente
        </label>
        {urgent && (
          <div className="alertbox">
            <b>Esta plataforma no es un servicio de emergencia y no responde al instante.</b> Si el animal está grave, busca ahora un veterinario o a la autoridad local, y envía también este reporte.
            <HelpContacts contacts={contacts} />
          </div>
        )}
      </section>

      <section className="fs">
        <h2><span className="num">2</span> Cuéntanos sobre el animal</h2>
        <div className="choices three" role="radiogroup" aria-label="Tipo de animal">
          <Opcion name="species" activo={species === "perro"} onClick={() => setSpecies("perro")} titulo="Perro" />
          <Opcion name="species" activo={species === "gato"} onClick={() => setSpecies("gato")} titulo="Gato" />
          <Opcion name="species" activo={species === "otro"} onClick={() => setSpecies("otro")} titulo="Otro" />
        </div>
        <label>¿Qué viste y cómo se encuentra?
          <textarea name="description" rows={5} required placeholder="Describe lo que viste y su estado. Evita nombrar a personas: solo cuenta los hechos." />
        </label>
        <div>
          <b>Fotos <span className="muted" style={{ fontWeight: 400 }}>(hasta 5, si puedes tomarlas sin ponerte en riesgo)</span></b>
          <PhotoPicker key={vuelta} onChange={setFiles} />
        </div>
      </section>

      <section className="fs">
        <h2><span className="num">3</span> ¿Dónde está?</h2>
        <ZonePicker
          key={vuelta}
          zona={zona}
          onZona={setZona}
          loc={loc}
          onLoc={setLoc}
          label="Calle, colonia o referencia"
          nota={publica ? "En la página pública solo se muestra una ubicación aproximada." : "Esta ubicación nunca se publica."}
        />
      </section>

      <section className="fs">
        <h2><span className="num">4</span> Tu contacto (opcional)</h2>
        <label>Tu WhatsApp, por si necesitamos más datos
          <input name="whatsapp" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="6621234567" />
        </label>
        {publica && (
          <label className="check">
            <input type="checkbox" checked={allow} onChange={(e) => setAllow(e.target.checked)} />
            Acepto que una persona que quiera ayudar me escriba por WhatsApp
          </label>
        )}
        <p className="muted" style={{ margin: 0, fontSize: ".95rem" }}>Puedes reportar sin dejar ningún dato. Tu número nunca se publica.</p>
      </section>

      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <Turnstile onToken={setToken} resetKey={captchaKey} />
      <button className="btn big" disabled={estado === "enviando" || (CAPTCHA_ACTIVO && !token)}>
        {estado === "enviando" ? mensaje || "Enviando…" : "Enviar reporte"}
      </button>
      {estado === "error" && <p className="error" role="alert">{mensaje}</p>}
    </form>
  );
}
