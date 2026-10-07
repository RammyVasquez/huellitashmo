"use client";
import Link from "next/link";
import { useState } from "react";
import { errTexto, normalizeWa } from "@/lib/util";
import Turnstile, { CAPTCHA_ACTIVO } from "./Turnstile";

type Vivienda = "casa_patio" | "casa_sin_patio" | "departamento" | "otro";
type SiNo = "si" | "no";

function Opcion({ activo, onClick, titulo, name }: { activo: boolean; onClick: () => void; titulo: string; name: string }) {
  return (
    <label className={`choice${activo ? " on" : ""}`}>
      <input type="radio" name={name} checked={activo} onChange={onClick} />
      <strong>{titulo}</strong>
    </label>
  );
}

export default function AdoptionForm({ animalId, animalName, shelterName }: { animalId: string; animalName: string; shelterName: string | null }) {
  const [housing, setHousing] = useState<Vivienda>("casa_patio");
  const [tenure, setTenure] = useState<"propia" | "renta">("propia");
  const [landlord, setLandlord] = useState<"si" | "no" | "aun_no">("si");
  const [kids, setKids] = useState<SiNo>("no");
  const [pets, setPets] = useState<SiNo>("no");
  const [visita, setVisita] = useState(false);
  const [compromiso, setCompromiso] = useState(false);
  const [privacidad, setPrivacidad] = useState(false);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [mensaje, setMensaje] = useState("");
  const [token, setToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const wa = normalizeWa(String(fd.get("whatsapp")));
    if (!wa || wa.length < 12) { setEstado("error"); setMensaje("Escribe tu WhatsApp con 10 dígitos (ej. 6621234567)."); return; }
    if (!visita || !compromiso || !privacidad) { setEstado("error"); setMensaje("Para enviar la solicitud acepta los tres compromisos del último paso."); return; }
    if (CAPTCHA_ACTIVO && !token) { setEstado("error"); setMensaje("Completa la verificación de seguridad."); return; }
    setEstado("enviando");
    setMensaje("");
    try {
      const body = new FormData();
      body.set("animal_id", animalId);
      for (const campo of ["name", "colonia", "household_size", "pets_note", "experience", "away_plan", "motivation", "website"])
        body.set(campo, String(fd.get(campo) ?? ""));
      body.set("whatsapp", wa);
      body.set("housing", housing);
      body.set("tenure", tenure);
      if (tenure === "renta") body.set("landlord_ok", landlord === "aun_no" ? "" : landlord);
      body.set("has_kids", kids === "si" ? "1" : "0");
      body.set("has_pets", pets === "si" ? "1" : "0");
      body.set("agrees_visit", "1");
      body.set("agrees_commitment", "1");
      body.set("consent", "1");
      body.set("token", token);
      const res = await fetch("/api/adopcion", { method: "POST", body });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error ?? "No pudimos enviar la solicitud.");
      setEstado("ok");
    } catch (err) {
      console.error(err);
      setEstado("error");
      setMensaje(errTexto(err));
      setToken("");
      setCaptchaKey((k) => k + 1);
    }
  }

  if (estado === "ok")
    return (
      <div className="form-card success" role="status">
        <h2>¡Recibimos tu solicitud!</h2>
        <p className="lead">
          {shelterName ? `El equipo de ${shelterName}` : "El refugio"} revisará tus respuestas y te contactará por WhatsApp. Enviarla no garantiza la adopción: la decisión final es del refugio.
        </p>
        <div className="actions">
          <Link className="btn" href="/animales">Ver más animales</Link>
          <Link className="btn ghost" href={`/animales/${animalId}`}>Volver a la ficha de {animalName}</Link>
        </div>
      </div>
    );

  const SiNoOpciones = ({ valor, set, name }: { valor: SiNo; set: (v: SiNo) => void; name: string }) => (
    <div className="choices three" role="radiogroup">
      <Opcion name={name} activo={valor === "no"} onClick={() => set("no")} titulo="No" />
      <Opcion name={name} activo={valor === "si"} onClick={() => set("si")} titulo="Sí" />
    </div>
  );

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <section className="fs">
        <h2><span className="num">1</span> Sobre ti</h2>
        <label>Nombre completo<input name="name" autoComplete="name" required /></label>
        <label>Tu WhatsApp (10 dígitos)<input name="whatsapp" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="6621234567" required /></label>
        <label>Colonia donde vives<input name="colonia" required /></label>
      </section>

      <section className="fs">
        <h2><span className="num">2</span> Tu hogar</h2>
        <b>¿Dónde vives?</b>
        <div className="choices" role="radiogroup" aria-label="Tipo de vivienda">
          <Opcion name="housing" activo={housing === "casa_patio"} onClick={() => setHousing("casa_patio")} titulo="Casa con patio" />
          <Opcion name="housing" activo={housing === "casa_sin_patio"} onClick={() => setHousing("casa_sin_patio")} titulo="Casa sin patio" />
          <Opcion name="housing" activo={housing === "departamento"} onClick={() => setHousing("departamento")} titulo="Departamento" />
          <Opcion name="housing" activo={housing === "otro"} onClick={() => setHousing("otro")} titulo="Otro" />
        </div>
        <b>¿Es propia o rentas?</b>
        <div className="choices" role="radiogroup" aria-label="Propia o rentada">
          <Opcion name="tenure" activo={tenure === "propia"} onClick={() => setTenure("propia")} titulo="Propia" />
          <Opcion name="tenure" activo={tenure === "renta"} onClick={() => setTenure("renta")} titulo="Rento" />
        </div>
        {tenure === "renta" && (
          <>
            <b>¿Tu propietario permite mascotas?</b>
            <div className="choices three" role="radiogroup">
              <Opcion name="landlord" activo={landlord === "si"} onClick={() => setLandlord("si")} titulo="Sí" />
              <Opcion name="landlord" activo={landlord === "no"} onClick={() => setLandlord("no")} titulo="No" />
              <Opcion name="landlord" activo={landlord === "aun_no"} onClick={() => setLandlord("aun_no")} titulo="Aún no sé" />
            </div>
          </>
        )}
        <label>¿Cuántas personas viven en tu casa (contándote)?
          <input name="household_size" type="number" min={1} max={30} defaultValue={1} required />
        </label>
        <b>¿Hay niños en casa?</b>
        <SiNoOpciones valor={kids} set={setKids} name="kids" />
        <b>¿Tienes otros animales?</b>
        <SiNoOpciones valor={pets} set={setPets} name="pets" />
        {pets === "si" && <label>¿Cuáles? (especie, edad, si están esterilizados o castrados)<input name="pets_note" /></label>}
      </section>

      <section className="fs">
        <h2><span className="num">3</span> Tu experiencia</h2>
        <label>¿Has tenido mascotas antes? Cuéntanos (opcional)<textarea name="experience" rows={3} /></label>
        <label>Cuando salgas de viaje o trabajes todo el día, ¿quién lo cuidará? (opcional)<textarea name="away_plan" rows={3} /></label>
        <label>¿Por qué quieres adoptar a {animalName}?
          <textarea name="motivation" rows={4} required minLength={20} placeholder="Cuéntanos con tus palabras (mínimo 20 caracteres)." />
        </label>
      </section>

      <section className="fs">
        <h2><span className="num">4</span> Compromisos</h2>
        <p className="muted" style={{ margin: 0 }}>Marca las tres casillas para poder enviar tu solicitud.</p>
        <label className="check">
          <input type="checkbox" checked={visita} onChange={(e) => setVisita(e.target.checked)} />
          <span className="check-body">
            <strong>Entrevista y visita</strong>
            <span>Acepto que el refugio me haga una entrevista y, si lo pide, una visita a mi hogar.</span>
          </span>
        </label>
        <label className="check">
          <input type="checkbox" checked={compromiso} onChange={(e) => setCompromiso(e.target.checked)} />
          <span className="check-body">
            <strong>Cuidado responsable de por vida</strong>
            <span>Me comprometo a:</span>
            <span className="linea">Darle cuidados veterinarios y vacunas.</span>
            <span className="linea">Esterilizarlo o castrarlo si aún no lo está.</span>
            <span className="linea">No venderlo, regalarlo ni abandonarlo.</span>
            <span className="linea">Regresarlo al refugio si ya no puedo cuidarlo.</span>
          </span>
        </label>
        <label className="check">
          <input type="checkbox" checked={privacidad} onChange={(e) => setPrivacidad(e.target.checked)} />
          <span className="check-body">
            <strong>Privacidad</strong>
            <span>Acepto que mis datos se compartan con {shelterName ?? "el refugio"} para evaluar mi solicitud, y el <a href="/privacidad" target="_blank" rel="noopener noreferrer">aviso de privacidad</a>.</span>
          </span>
        </label>
      </section>

      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <Turnstile onToken={setToken} resetKey={captchaKey} />
      <button className="btn big" disabled={estado === "enviando" || (CAPTCHA_ACTIVO && !token)}>
        {estado === "enviando" ? "Enviando…" : "Enviar solicitud"}
      </button>
      {estado === "error" && <p className="error" role="alert">{mensaje}</p>}
    </form>
  );
}
