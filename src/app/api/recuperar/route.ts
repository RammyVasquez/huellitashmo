import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { enviarCorreo } from "@/lib/server/correo";
import { sitioUrl } from "@/lib/server/notify";
import { ErrorUsuario, ipDe, verificarCaptcha } from "@/lib/server/intake";

export const dynamic = "force-dynamic";
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESPUESTA = { ok: true }; // siempre la misma: no revela si el correo tiene cuenta

// Envía un enlace para crear una contraseña nueva (solo a cuentas del panel). Límite: 1 envío cada 10 minutos por correo y 20 por hora en total.
export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    if (String(fd.get("website") ?? "")) return NextResponse.json(RESPUESTA);
    await verificarCaptcha(String(fd.get("captcha") ?? ""), ipDe(req));
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    if (!CORREO.test(email) || email.length > 160) throw new ErrorUsuario("Escribe un correo válido.");

    const db = supabaseAdmin();
    const hace10 = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const hace1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [{ data: previo }, { count }] = await Promise.all([
      db.from("recovery_throttle").select("last_at").eq("email", email).maybeSingle(),
      db.from("recovery_throttle").select("email", { count: "exact", head: true }).gte("last_at", hace1h),
    ]);
    if ((previo && previo.last_at > hace10) || (count ?? 0) >= 20) return NextResponse.json(RESPUESTA);
    await db.from("recovery_throttle").upsert({ email, last_at: new Date().toISOString() });

    const { data, error } = await db.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: `${sitioUrl()}/admin/restablecer` } });
    const enlace = data?.properties?.action_link;
    if (!error && enlace) {
      await enviarCorreo(email, "Crea tu contraseña nueva · Huellitas HMO", [
        "Hola,",
        "",
        "Recibimos una solicitud para crear una contraseña nueva en el panel de Huellitas HMO.",
        "Si fuiste tú, abre este enlace (sirve una sola vez y vence en una hora):",
        "",
        enlace,
        "",
        "Si no fuiste tú, ignora este mensaje: tu contraseña no cambia.",
      ].join("\n"));
    }
    return NextResponse.json(RESPUESTA);
  } catch (e) {
    if (e instanceof ErrorUsuario) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[recuperar]", e instanceof Error ? e.message : "error");
    return NextResponse.json(RESPUESTA); // un fallo interno tampoco debe revelar nada
  }
}
