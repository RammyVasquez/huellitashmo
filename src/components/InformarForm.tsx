"use client";
import { useState } from "react";
import Turnstile, { CAPTCHA_ACTIVO } from "./Turnstile";

// Para reportes donde quien avisó no dejó WhatsApp: el mensaje llega al equipo de Huellitas HMO
export default function InformarForm({ reportId, perdido }: { reportId: string; perdido: boolean }) {
  const [token, setToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (CAPTCHA_ACTIVO && !token) { setError("Completa la verificación de seguridad."); return; }
    const fd = new FormData(e.currentTarget);
    fd.set("report_id", reportId);
    fd.set("token", token);
    setEnviando(true);
    try {
      const res = await fetch("/api/informar", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "No pudimos enviar tu mensaje.");
      setHecho(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar tu mensaje.");
      setToken(""); setCaptchaKey((k) => k + 1);
    }
    setEnviando(false);
  }

  if (hecho) return <p className="ok" role="status">¡Gracias! Recibimos tu mensaje y lo revisará el equipo de Huellitas HMO.</p>;

  return (
    <details className="box informar">
      <summary><b>{perdido ? "Vi a esta mascota" : "Creo que es mi mascota"}: enviar información</b></summary>
      <p className="muted" style={{ marginTop: ".6rem" }}>
        Quien publicó este reporte no dejó un contacto directo. Tu mensaje llega al equipo de Huellitas HMO, que lo revisa y busca la forma de hacerlo llegar. Si quieres que te respondamos, deja un dato de contacto.
      </p>
      <form className="stack" onSubmit={onSubmit}>
        <label>¿Qué viste o qué sabes?
          <textarea name="message" rows={4} required minLength={5} maxLength={600} placeholder={perdido ? "Ej. Lo vi ayer en la tarde cerca de la plaza, con un collar rojo" : "Ej. Es mi perro, se llama Max y tiene una mancha en la oreja"} />
        </label>
        <label>Tu WhatsApp o nombre (opcional)<input name="contact" maxLength={80} /></label>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
        <Turnstile onToken={setToken} resetKey={captchaKey} />
        <button className="btn" disabled={enviando}>{enviando ? "Enviando…" : "Enviar mensaje"}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
    </details>
  );
}
