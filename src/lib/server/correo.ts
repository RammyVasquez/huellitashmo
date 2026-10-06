import nodemailer from "nodemailer";

export type ResultadoCorreo = { canal: "enviado" | "falló" | "no configurado"; detalle?: string };

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Envía un correo de texto. Usa Resend si está configurado; si no, Gmail con contraseña de aplicación.
export async function enviarCorreo(para: string, asunto: string, texto: string): Promise<ResultadoCorreo> {
  if (!CORREO.test(para)) return { canal: "falló", detalle: "correo de destino no válido" };
  const respuestasA = process.env.REPLY_TO_EMAIL || process.env.GMAIL_USER;

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_EMAIL_FROM;
  if (resendKey && from) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [para], subject: asunto, text: texto, ...(respuestasA ? { reply_to: respuestasA } : {}) }),
        cache: "no-store",
      });
      if (r.ok) return { canal: "enviado" };
      console.error("[correo] Resend falló:", r.status);
      return { canal: "falló", detalle: `Resend respondió ${r.status}` };
    } catch {
      return { canal: "falló", detalle: "no se pudo conectar con Resend" };
    }
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (user && pass) {
    try {
      const t = nodemailer.createTransport({
        host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass },
        connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000,
      });
      await t.sendMail({ from: `"Huellitas HMO" <${user}>`, to: para, replyTo: respuestasA, subject: asunto, text: texto });
      return { canal: "enviado" };
    } catch (e) {
      const c = (e as { code?: string }).code;
      console.error("[correo] Gmail falló:", c ?? "error"); // nunca se registra la contraseña
      return { canal: "falló", detalle: c === "EAUTH" ? "Gmail rechazó el usuario o la contraseña de aplicación" : `no se pudo enviar por Gmail (${c ?? "error"})` };
    }
  }

  return { canal: "no configurado", detalle: "faltan GMAIL_USER y GMAIL_APP_PASSWORD (o RESEND_API_KEY y NOTIFY_EMAIL_FROM)" };
}
