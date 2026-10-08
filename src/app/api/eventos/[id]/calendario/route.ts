import { construirIcs } from "@/lib/eventos";
import { supabase } from "@/lib/supabase";
import type { EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Descarga el evento como archivo de calendario (.ics)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return new Response("No encontrado", { status: 404 });
  const { data } = await supabase.from("events").select("*").eq("id", params.id).in("status", ["programado", "realizado"]).maybeSingle();
  const e = data as EventRow | null;
  if (!e) return new Response("No encontrado", { status: 404 });
  let organizador = "Equipo de Huellitas HMO";
  if (e.shelter_id) {
    const { data: sh } = await supabase.from("shelters").select("name").eq("id", e.shelter_id).maybeSingle();
    if (sh?.name) organizador = sh.name;
  }
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return new Response(construirIcs(e, organizador, `${sitio}/eventos`), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="evento-huellitas-hmo.ics"', "Cache-Control": "no-store" },
  });
}
