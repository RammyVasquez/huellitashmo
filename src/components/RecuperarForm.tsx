"use client";
import { useState } from "react";
import Turnstile, { CAPTCHA_ACTIVO } from "./Turnstile";

export default function RecuperarForm() {
  const [token, setToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (CAPTCHA_ACTIVO && !token) { setError("Espera a que termine la verificación e inténtalo de nuevo."); return; }
    const fd = new FormData(e.currentTarget);
    fd.set("captcha", token);
    setEnviando(true);
    try {
      const res = await fetch("/api/recuperar", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "No pudimos enviar el correo. Intenta de nuevo.");
      setHecho(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar el correo.");
      setCaptchaKey((k) => k + 1); setToken("");
    }
    setEnviando(false);
  }

  if (hecho)
    return (
      <div className="box" role="status">
        <b>Revisa tu correo.</b> Si ese correo tiene una cuenta del panel, te enviamos un enlace para crear una contraseña nueva. Puede tardar unos minutos y a veces cae en spam.
      </div>
    );

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label>Tu correo del panel<input name="email" type="email" required autoComplete="username" /></label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      <Turnstile onToken={setToken} resetKey={captchaKey} />
      <button className="btn" disabled={enviando}>{enviando ? "Enviando…" : "Enviarme el enlace"}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
