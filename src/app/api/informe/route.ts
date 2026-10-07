import { supabase } from "@/lib/supabase";
import { generarInforme } from "@/lib/server/informe";
import { nombreTipo } from "@/lib/refugios";
import { TIPOS_EVENTO, type EventKind, type ImpactStats, type MesImpacto } from "@/lib/types";

export const dynamic = "force-dynamic";

const dia = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { timeZone: "America/Hermosillo", day: "numeric", month: "short", year: "numeric" });

// Informe de impacto en PDF con datos reales y públicos (solo cifras agregadas, sin datos personales)
export async function GET() {
  const [{ data: st }, { data: ms }, { data: sh }, { data: ev }, { data: primero }] = await Promise.all([
    supabase.from("impact_stats").select("*").single(),
    supabase.from("impact_by_month").select("*").order("mes"),
    supabase.from("shelters").select("name, kind, verified_at").order("name"),
    supabase.from("events").select("title, kind, starts_at, attendees, adoptions_count, sterilizations_count, results_note").eq("status", "realizado").order("starts_at", { ascending: false }).limit(4),
    supabase.from("animals").select("created_at").order("created_at", { ascending: true }).limit(1),
  ]);
  const s = (st ?? {}) as Partial<ImpactStats>;
  const meses = (ms ?? []) as MesImpacto[];

  const bytes = await generarInforme({
    generado: new Date(),
    desde: primero?.[0]?.created_at ? dia(primero[0].created_at) : null,
    cifras: [
      { etiqueta: "animales registrados", valor: s.animales_registrados ?? 0 },
      { etiqueta: "adopciones", valor: s.adopciones ?? 0 },
      { etiqueta: "animales esterilizados", valor: s.esterilizados ?? 0 },
      { etiqueta: "padrinos", valor: s.padrinos ?? 0 },
      { etiqueta: "familias reunidas", valor: s.reunificaciones ?? 0 },
      { etiqueta: "animales auxiliados", valor: s.auxiliados ?? 0 },
      { etiqueta: "seguimientos de adopción respondidos", valor: s.seguimientos ?? 0 },
      { etiqueta: "eventos realizados", valor: s.eventos ?? 0 },
      { etiqueta: "historias publicadas", valor: s.historias ?? 0 },
    ],
    meses: meses.map((m) => ({ mes: m.mes, reportes: m.reportes, adopciones: m.adopciones, auxiliados: m.auxiliados })),
    refugios: (sh ?? []).map((x: { name: string; kind: string | null; verified_at: string | null }) => ({ nombre: x.name, tipo: nombreTipo(x.kind), verificado: !!x.verified_at })),
    eventos: (ev ?? []).map((e: { title: string; kind: EventKind; starts_at: string; attendees: number | null; adoptions_count: number | null; sterilizations_count: number | null; results_note: string | null }) => ({
      fecha: dia(e.starts_at),
      titulo: e.title,
      tipo: TIPOS_EVENTO[e.kind] ?? "Evento",
      resultados: [
        e.attendees != null ? `${e.attendees} asistentes` : "",
        e.adoptions_count != null ? `${e.adoptions_count} adopciones` : "",
        e.sterilizations_count != null ? `${e.sterilizations_count} esterilizaciones` : "",
        e.results_note ?? "",
      ].filter(Boolean).join(" · "),
    })),
  });

  const hoy = new Date().toISOString().slice(0, 10);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="informe-impacto-huellitas-hmo-${hoy}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
