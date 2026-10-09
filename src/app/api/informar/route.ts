import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { avisarAdmin, avisarError, sitioUrl } from "@/lib/server/notify";
import { ErrorUsuario, ipDe, texto, verificarCaptcha } from "@/lib/server/intake";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Alguien tiene información sobre un reporte publicado. Llega al equipo (nunca se publica).
export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    if (String(fd.get("website") ?? "")) return NextResponse.json({ ok: true }); // trampa para bots
    await verificarCaptcha(String(fd.get("token") ?? ""), ipDe(req));

    const id = String(fd.get("report_id") ?? "");
    if (!UUID.test(id)) throw new ErrorUsuario("Reporte no válido.");
    const message = texto(fd, "message", 5, 600, "tu mensaje");
    const contact = String(fd.get("contact") ?? "").trim().slice(0, 80) || null;

    const db = supabaseAdmin();
    const { data: rep } = await db.from("reports").select("id, kind, species, zone").eq("id", id).eq("status", "activo").maybeSingle();
    if (!rep) throw new ErrorUsuario("Este reporte ya no está disponible.");

    const hace1h = new Date(Date.now() - 3600 * 1000).toISOString();
    const { count } = await db.from("report_tips").select("id", { count: "exact", head: true }).eq("report_id", id).gte("created_at", hace1h);
    if ((count ?? 0) >= 5) throw new ErrorUsuario("Ya recibimos varios mensajes sobre este reporte. Gracias; los estamos revisando.");

    const { error } = await db.from("report_tips").insert({ report_id: id, message, contact });
    if (error) throw error;

    await avisarAdmin(
      `Información sobre un reporte: ${rep.species} ${rep.kind}`,
      [`Zona: ${rep.zone ?? "sin zona"}`, `Mensaje: ${message.slice(0, 200)}`, contact ? "Dejó un dato de contacto." : "No dejó contacto."],
      `${sitioUrl()}/admin`
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorUsuario) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("api/informar", e);
    await avisarError("/api/informar");
    return NextResponse.json({ error: "No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos." }, { status: 500 });
  }
}
