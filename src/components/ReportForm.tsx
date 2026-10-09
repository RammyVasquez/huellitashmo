"use client";
import Link from "next/link";
import { useState } from "react";
import { comprimirImagen } from "@/lib/upload";
import { errTexto, normalizeWa } from "@/lib/util";
import type { Pos } from "@/lib/geo";
import PhotoPicker from "./PhotoPicker";
import Turnstile, { CAPTCHA_ACTIVO } from "./Turnstile";
import ZonePicker from "./ZonePicker";
import CoincidenciasRapidas from "./CoincidenciasRapidas";

const MAX_FOTOS = 5;
type Kind = "perdido" | "encontrado";
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

export default function ReportForm() {
  const [kind, setKind] = useState<Kind>("perdido");
  const [species, setSpecies] = useState<Species>("perro");
  const [zona, setZona] = useState("");
  const [loc, setLoc] = useState<Pos | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [mensaje, setMensaje] = useState("");
  const [token, setToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [vuelta, setVuelta] = useState(0);
  const [enviado, setEnviado] = useState<{ kind: Kind; species: Species; loc: Pos | null; descripcion: string; sinContacto: boolean } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const wa = normalizeWa(String(fd.get("whatsapp") ?? ""));
    if (wa && wa.length < 12) {
      setEstado("error");
      setMensaje("Revisa tu WhatsApp: debe tener 10 dígitos (ej. 6621234567). Si prefieres, déjalo vacío.");
      return;
    }
    const desc = String(fd.get("description") ?? "").trim();
    if (!desc && files.length === 0) {
      setEstado("error");
      setMensaje("Agrega una foto o escribe una descripción del animal.");
      return;
    }
    if (desc && desc.length < 5) {
      setEstado("error");
      setMensaje("La descripción es muy corta. Cuéntanos un poco más o déjala en blanco y agrega una foto.");
      return;
    }
    if (!zona.trim()) {
      setEstado("error");
      setMensaje("Dinos dónde fue (una calle, una colonia o toca el mapa).");
      return;
    }
    if (CAPTCHA_ACTIVO && !token) {
      setEstado("error");
      setMensaje("Completa la verificación de seguridad.");
      return;
    }
    setEstado("enviando");
    setMensaje(files.length ? "Subiendo fotos…" : "");
    try {
      const body = new FormData();
      body.set("kind", kind);
      body.set("species", species);
      body.set("description", String(fd.get("description")).trim());
      body.set("marks", String(fd.get("marks") ?? "").trim());
      if (kind === "encontrado") body.set("private_detail", String(fd.get("private_detail") ?? "").trim());
      body.set("zone", zona.trim());
      if (wa) body.set("whatsapp", wa);
      if (loc) { body.set("lat", String(loc.lat)); body.set("lng", String(loc.lng)); }
      body.set("token", token);
      body.set("website", String(fd.get("website") ?? ""));
      const blobs = await Promise.all(files.map((f) => comprimirImagen(f, 1400, "image/jpeg")));
      if (blobs.reduce((n, b) => n + b.size, 0) > 4_000_000) throw new Error("Las fotos pesan demasiado. Quita alguna e intenta de nuevo.");
      blobs.forEach((b, i) => body.append("fotos", b, `foto-${i + 1}.jpg`));
      const res = await fetch("/api/reportes", { method: "POST", body });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error ?? "No pudimos enviar el reporte.");
      setEnviado({ kind, species, loc, descripcion: `${String(fd.get("description"))} ${String(fd.get("marks") ?? "")}`, sinContacto: !wa });
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
    setKind("perdido"); setSpecies("perro"); setZona(""); setLoc(null); setFiles([]); setEnviado(null);
    setMensaje(""); setToken(""); setEstado("idle"); setVuelta((v) => v + 1);
  }

  if (estado === "ok")
    return (
      <div className="form-card success" role="status">
        <h2>¡Gracias por avisar!</h2>
        <p className="lead">Revisaremos tu reporte y lo publicaremos pronto. Mientras tanto, comparte tu caso con tus vecinos y en los grupos de tu colonia.</p>
        {enviado?.sinContacto && <p className="muted">Como no dejaste un contacto, no podremos avisarte si alguien responde: la información que llegue quedará en el reporte para el equipo.</p>}
        <div className="actions">
          <Link className="btn" href="/reportes">Ver perdidos y encontrados</Link>
          <button className="btn ghost" onClick={reiniciar}>Hacer otro reporte</button>
        </div>
        {enviado && <CoincidenciasRapidas kind={enviado.kind} species={enviado.species} loc={enviado.loc} descripcion={enviado.descripcion} />}
      </div>
    );

  return (
    <form className="form-card" onSubmit={onSubmit} key={vuelta}>
      <section className="fs">
        <h2><span className="num">1</span> ¿Qué pasó?</h2>
        <div className="choices">
          <Opcion name="kind" activo={kind === "perdido"} onClick={() => setKind("perdido")} titulo="Perdí a mi mascota" texto="Quiero que me ayuden a encontrarla" />
          <Opcion name="kind" activo={kind === "encontrado"} onClick={() => setKind("encontrado")} titulo="Encontré una mascota" texto="Quiero ayudar a que vuelva a casa" />
        </div>
      </section>

      <section className="fs">
        <h2><span className="num">2</span> Cuéntanos sobre el animal</h2>
        <p className="muted" style={{ margin: 0 }}>Con una foto basta para empezar. Lo demás ayuda, pero es opcional.</p>
        <div className="choices three" role="radiogroup" aria-label="Tipo de animal">
          <Opcion name="species" activo={species === "perro"} onClick={() => setSpecies("perro")} titulo="Perro" />
          <Opcion name="species" activo={species === "gato"} onClick={() => setSpecies("gato")} titulo="Gato" />
          <Opcion name="species" activo={species === "otro"} onClick={() => setSpecies("otro")} titulo="Otro" />
        </div>
        <div>
          <b>Fotos <span className="muted" style={{ fontWeight: 400 }}>(hasta {MAX_FOTOS}; de frente, de lado y su seña particular)</span></b>
          <PhotoPicker key={vuelta} max={MAX_FOTOS} onChange={setFiles} />
        </div>
        <label>Descripción <span className="muted" style={{ fontWeight: 400 }}>(opcional si pones foto: color, tamaño, cómo es)</span>
          <textarea name="description" rows={3} maxLength={1000} placeholder="Ej. Perro mediano, color café claro, como de 3 años, muy amigable" />
        </label>
        <label>Señas particulares <span className="muted" style={{ fontWeight: 400 }}>(lo que más ayuda a reconocerlo)</span>
          <input name="marks" maxLength={400} placeholder="Ej. mancha blanca en la panza, collar rosa con cascabel, cicatriz en la oreja" />
        </label>
        {kind === "encontrado" && (
          <label>Un detalle que NO vamos a publicar <span className="muted" style={{ fontWeight: 400 }}>(opcional)</span>
            <input name="private_detail" maxLength={300} placeholder="Algo que solo su dueño sabría, para confirmar que es suyo" />
          </label>
        )}
      </section>

      <section className="fs">
        <h2><span className="num">3</span> ¿Dónde fue?</h2>
        <ZonePicker
          key={vuelta}
          zona={zona}
          onZona={setZona}
          loc={loc}
          onLoc={setLoc}
          nota={`Marcar el lugar exacto es opcional, pero ayuda mucho.${kind === "encontrado" ? " Por seguridad, de las mascotas encontradas solo mostramos una zona aproximada." : ""}`}
        />
      </section>

      <section className="fs">
        <h2><span className="num">4</span> ¿Quieres que te contacten? <span className="muted" style={{ fontWeight: 400, fontSize: "1rem" }}>(opcional)</span></h2>
        <label>Tu WhatsApp (10 dígitos)
          <input name="whatsapp" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="6621234567" />
        </label>
        <p className="muted" style={{ margin: 0, fontSize: ".95rem" }}>
          Tu número nunca se publica: la gente te escribe desde un botón. {kind === "encontrado" ? "Si solo viste al animal y no lo tienes contigo, puedes dejarlo vacío:" : "Si prefieres no dejarlo,"} el reporte se publica igual y quien tenga información escribirá al equipo de Huellitas HMO.
        </p>
      </section>

      <p className="muted" style={{ margin: 0, fontSize: ".92rem" }}>
        Al enviar este reporte aceptas el <a href="/privacidad" target="_blank" rel="noopener noreferrer">aviso de privacidad</a> y las <a href="/reglas" target="_blank" rel="noopener noreferrer">reglas de uso</a>.
      </p>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <Turnstile onToken={setToken} resetKey={captchaKey} />
      <button className="btn big" disabled={estado === "enviando" || (CAPTCHA_ACTIVO && !token)}>
        {estado === "enviando" ? mensaje || "Enviando…" : "Enviar reporte"}
      </button>
      {estado === "error" && <p className="error" role="alert">{mensaje}</p>}
    </form>
  );
}
