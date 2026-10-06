import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { avisarAdmin, sitioUrl } from "@/lib/server/notify";

export const dynamic = "force-dynamic";

// Tarea diaria (Vercel Cron, ver vercel.json): toca la base de datos y manda un resumen de pendientes.
// Vercel envía "Authorization: Bearer <CRON_SECRET>" si la variable CRON_SECRET existe.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const hoy = new Date().toISOString().slice(0, 10);
  const cuenta = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

  const [reportes, rescates, urgentes, solicitudes, seguimientos] = await Promise.all([
    cuenta(db.from("reports").select("id", { count: "exact", head: true }).eq("status", "pendiente")),
    cuenta(db.from("welfare_reports").select("id", { count: "exact", head: true }).eq("status", "pendiente")),
    cuenta(db.from("welfare_reports").select("id", { count: "exact", head: true }).eq("status", "pendiente").eq("urgent", true)),
    cuenta(db.from("adoption_requests").select("id", { count: "exact", head: true }).eq("status", "nueva")),
    cuenta(db.from("adoption_followups").select("id", { count: "exact", head: true }).eq("status", "pendiente").lte("due_date", hoy)),
  ]);

  const lineas: string[] = [];
  if (reportes) lineas.push(`Reportes de mascotas por revisar: ${reportes}`);
  if (rescates) lineas.push(`Reportes de rescate por revisar: ${rescates}${urgentes ? ` (${urgentes} urgentes)` : ""}`);
  if (solicitudes) lineas.push(`Solicitudes de adopción nuevas: ${solicitudes}`);
  if (seguimientos) lineas.push(`Seguimientos post-adopción por enviar: ${seguimientos}`);
  if (new Date().getUTCDay() === 1) lineas.push("Es lunes: descarga el respaldo semanal en Panel → Respaldo.");

  if (lineas.length) await avisarAdmin("Resumen diario de Huellitas HMO", lineas, `${sitioUrl()}/admin`);
  return NextResponse.json({ ok: true, reportes, rescates, urgentes, solicitudes, seguimientos });
}
