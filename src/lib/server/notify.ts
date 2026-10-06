import { supabaseAdmin } from "@/lib/supabase";
import { enviarCorreo } from "@/lib/server/correo";

type Canal = "enviado" | "falló" | "no configurado";

// Avisa al administrador por Telegram y/o correo. Nunca incluye teléfonos ni el texto del reporte:
// solo lo necesario para que sepas que debes entrar al panel.
export async function avisarAdmin(
  titulo: string,
  lineas: string[],
  url: string
): Promise<{ telegram: Canal; correo: Canal; detalle?: string }> {
  const texto = [titulo, ...lineas, url].join("\n");

  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  const to = process.env.NOTIFY_EMAIL_TO;

  // Lee el motivo que devuelve el servicio (no contiene llaves) para poder diagnosticar
  const motivo = async (r: Response) => {
    try { const j = (await r.json()) as { description?: string; message?: string }; return `${r.status} ${j.description ?? j.message ?? ""}`.trim(); }
    catch { return String(r.status); }
  };

  const telegram = async (): Promise<{ canal: Canal; detalle?: string }> => {
    if (!tgToken) return { canal: "no configurado", detalle: "falta TELEGRAM_BOT_TOKEN" };
    if (!tgChat) return { canal: "no configurado", detalle: "falta TELEGRAM_CHAT_ID" };
    try {
      const r = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: tgChat, text: texto, disable_web_page_preview: true }),
        cache: "no-store",
      });
      if (r.ok) return { canal: "enviado" };
      const d = await motivo(r);
      console.error("[aviso] Telegram falló:", d);
      return { canal: "falló", detalle: `Telegram respondió: ${d}` };
    } catch (e) {
      console.error("[aviso] Telegram sin conexión:", e);
      return { canal: "falló", detalle: "no se pudo conectar con Telegram" };
    }
  };

  const correo = async (): Promise<{ canal: Canal; detalle?: string }> => {
    if (!to) return { canal: "no configurado" };
    const r = await enviarCorreo(to, titulo, texto);
    return r;
  };

  const [t, c] = await Promise.all([telegram(), correo()]);
  const detalle = [t.canal !== "enviado" ? t.detalle : null, c.canal === "falló" ? c.detalle : null].filter(Boolean).join(" · ");
  return { telegram: t.canal, correo: c.canal, detalle: detalle || undefined };
}

export const sitioUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Avisa que algo falló de forma inesperada (nunca incluye datos de la persona)
export async function avisarError(ruta: string) {
  try {
    await avisarAdmin("⚠️ Falló un formulario del sitio", [`Ruta: ${ruta}`, "Revisa los registros (Logs) en Vercel."], `${sitioUrl()}/admin`);
  } catch { /* nunca debe impedir responder a la persona */ }
}

// Avisa por correo al refugio dueño del animal (correo privado en shelter_private). Nunca incluye datos personales de las familias.
export async function avisarRefugio(shelterId: string | null, asunto: string, cuerpo: string) {
  if (!shelterId) return;
  try {
    const { data } = await supabaseAdmin().from("shelter_private").select("notify_email").eq("shelter_id", shelterId).maybeSingle();
    const para = data?.notify_email;
    if (para) await enviarCorreo(para, asunto, cuerpo);
  } catch (e) {
    console.error("[aviso refugio]", e instanceof Error ? e.message : "error");
  }
}
