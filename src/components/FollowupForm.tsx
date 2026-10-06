"use client";
import { useState } from "react";
import { errTexto } from "@/lib/util";
import { comprimirImagen } from "@/lib/upload";
import PhotoPicker from "./PhotoPicker";
import Turnstile, { CAPTCHA_ACTIVO } from "./Turnstile";

type Adapt = "muy_bien" | "bien" | "con_dificultades";

export default function FollowupForm({ token, animalName }: { token: string; animalName: string }) {
  const [adapted, setAdapted] = useState<Adapt>("muy_bien");
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [mensaje, setMensaje] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (CAPTCHA_ACTIVO && !captcha) { setEstado("error"); setMensaje("Completa la verificación de seguridad."); return; }
    setEstado("enviando");
    setMensaje(files.length ? "Subiendo fotos…" : "");
    try {
      const body = new FormData();
      body.set("token", token);
      body.set("captcha", captcha);
      body.set("adapted", adapted);
      body.set("notes", String(fd.get("notes") ?? ""));
      body.set("photo_consent", consent ? "1" : "0");
      body.set("website", String(fd.get("website") ?? ""));
      const blobs = await Promise.all(files.map((f) => comprimirImagen(f, 1400, "image/jpeg")));
      if (blobs.reduce((n, b) => n + b.size, 0) > 4_000_000) throw new Error("Las fotos pesan demasiado. Quita alguna e intenta de nuevo.");
      blobs.forEach((b, i) => body.append("fotos", b, `foto-${i + 1}.jpg`));
      const res = await fetch("/api/seguimiento", { method: "POST", body });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error ?? "No pudimos enviar tu respuesta.");
      setEstado("ok");
    } catch (err) {
      console.error(err);
      setEstado("error");
      setMensaje(errTexto(err));
      setCaptcha("");
      setCaptchaKey((k) => k + 1);
    }
  }

  if (estado === "ok")
    return (
      <div className="form-card success" role="status">
        <h2>¡Gracias por contarnos!</h2>
        <p className="lead">Saber que {animalName} está bien nos da muchísimo gusto, y ayuda al refugio a seguir rescatando.</p>
      </div>
    );

  const Opcion = ({ v, titulo }: { v: Adapt; titulo: string }) => (
    <label className={`choice${adapted === v ? " on" : ""}`}>
      <input type="radio" name="adapted" checked={adapted === v} onChange={() => setAdapted(v)} />
      <strong>{titulo}</strong>
    </label>
  );

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <section className="fs">
        <h2>¿Cómo va {animalName}?</h2>
        <div className="choices" role="radiogroup" aria-label="Adaptación">
          <Opcion v="muy_bien" titulo="Se adaptó muy bien" />
          <Opcion v="bien" titulo="Se adaptó bien" />
          <Opcion v="con_dificultades" titulo="Con dificultades" />
        </div>
        <label>Cuéntanos más (opcional)<textarea name="notes" rows={4} placeholder="Cómo come, cómo duerme, cómo se lleva con la familia…" /></label>
      </section>
      <section className="fs">
        <h2>Una foto (opcional)</h2>
        <PhotoPicker max={3} onChange={setFiles} />
        {files.length > 0 && (
          <label className="check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            Autorizo que el refugio use estas fotos en publicaciones o historias de adopción.</label>
        )}
      </section>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <Turnstile onToken={setCaptcha} resetKey={captchaKey} />
      <button className="btn big" disabled={estado === "enviando" || (CAPTCHA_ACTIVO && !captcha)}>{estado === "enviando" ? mensaje || "Enviando…" : "Enviar"}</button>
      {estado === "error" && <p className="error" role="alert">{mensaje}</p>}
    </form>
  );
}
