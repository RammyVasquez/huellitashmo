import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { puntuar } from "@/lib/coincidencias";
import { fmtKm } from "@/lib/geo";
import { avisarAdmin, sitioUrl } from "@/lib/server/notify";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Fila = { id: string; kind: "perdido" | "encontrado"; species: string; zone: string | null; lat: number | null; lng: number | null; description: string; created_at: string; status: string };

// Solo equipo (administrador o moderador): busca posibles coincidencias de un reporte recién publicado y avisa por Telegram
export async function POST(req: Request) {
  const cliente = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: req.headers.get("authorization") ?? "" } },
    auth: { persistSession: false },
  });
  const [{ data: admin }, { data: mod }] = await Promise.all([cliente.rpc("is_admin"), cliente.rpc("is_moderator")]);
  if (admin !== true && mod !== true) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id || !UUID.test(id)) return NextResponse.json({ error: "Reporte no válido" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: base } = await db.from("reports").select("id, kind, species, zone, lat, lng, description, created_at, status").eq("id", id).maybeSingle();
  if (!base || (base as Fila).status !== "activo") return NextResponse.json({ candidatos: [] });
  const r = base as Fila;

  const desde = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: otros } = await db.from("reports")
    .select("id, kind, species, zone, lat, lng, description, created_at, status")
    .eq("kind", r.kind === "perdido" ? "encontrado" : "perdido").eq("species", r.species).eq("status", "activo").gte("created_at", desde).limit(300);

  const candidatos = ((otros ?? []) as Fila[])
    .map((o) => ({ o, p: puntuar(r, o) }))
    .filter((x): x is { o: Fila; p: NonNullable<ReturnType<typeof puntuar>> } => x.p !== null)
    .sort((a, b) => b.p.score - a.p.score)
    .slice(0, 5)
    .map(({ o, p }) => ({ id: o.id, kind: o.kind, zone: o.zone, km: p.km, rasgos: p.rasgos, score: Math.round(p.score * 10) / 10 }));

  if (candidatos.length > 0) {
    await avisarAdmin(
      `Posible coincidencia: ${r.species} ${r.kind}`,
      [
        `Zona del reporte nuevo: ${r.zone ?? "sin zona"}`,
        ...candidatos.slice(0, 3).map((c) => `• ${c.kind} en ${c.zone ?? "sin zona"}${c.km != null ? ` (a ${fmtKm(c.km)})` : ""}${c.rasgos.length ? ` · coinciden: ${c.rasgos.join(", ")}` : ""}`),
        "Revisa las fotos y, si se parecen, comunica a las dos personas.",
      ],
      `${sitioUrl()}/admin`
    );
  }
  return NextResponse.json({ candidatos });
}
