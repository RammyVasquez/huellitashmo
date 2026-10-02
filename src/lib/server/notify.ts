type Canal = "enviado" | "falló" | "no configurado";

// Avisa al administrador por Telegram y/o correo. Nunca incluye teléfonos ni el texto del reporte:
// solo lo necesario para que sepas que debes entrar al panel.
export async function avisarAdmin(titulo: string, lineas: string[], url: string): Promise<{ telegram: Canal; correo: Canal }> {
  const texto = [titulo, ...lineas, url].join("\n");

  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL_TO;
  const from = process.env.NOTIFY_EMAIL_FROM;

  const telegram = async (): Promise<Canal> => {
    if (!tgToken || !tgChat) return "no configurado";
    try {
      const r = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: tgChat, text: texto, disable_web_page_preview: true }),
        cache: "no-store",
      });
      return r.ok ? "enviado" : "falló";
    } catch {
      return "falló";
    }
  };

  const correo = async (): Promise<Canal> => {
    if (!resendKey || !to || !from) return "no configurado";
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject: titulo, text: texto }),
        cache: "no-store",
      });
      return r.ok ? "enviado" : "falló";
    } catch {
      return "falló";
    }
  };

  const [t, c] = await Promise.all([telegram(), correo()]);
  return { telegram: t, correo: c };
}

export const sitioUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
