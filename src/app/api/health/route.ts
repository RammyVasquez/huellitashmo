import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Para monitores externos (UptimeRobot, etc.): responde 200 solo si el sitio y la base de datos funcionan.
// Al consultar la base también evita que Supabase pause un proyecto sin actividad.
export async function GET() {
  const t = Date.now();
  const { error } = await supabase.from("impact_stats").select("reportes").single();
  if (error) return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ ok: true, ms: Date.now() - t }, { headers: { "Cache-Control": "no-store" } });
}
