import EventosVista from "@/components/EventosVista";
import { supabase } from "@/lib/supabase";
import type { EventKind, EventRow, Shelter } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Eventos y jornadas · Huellitas HMO",
  description: "Jornadas de adopción, esterilización y castración, y acopio de donativos en Hermosillo.",
};

const TIPOS: EventKind[] = ["adopcion", "esterilizacion", "acopio", "otro"];

export default async function Eventos({ searchParams }: { searchParams: { tipo?: string } }) {
  const [{ data: ev }, { data: sh }] = await Promise.all([
    supabase.from("events").select("*").in("status", ["programado", "realizado"]).order("starts_at", { ascending: true }),
    supabase.from("shelters").select("id, name"),
  ]);
  const refugios = new Map(((sh ?? []) as Pick<Shelter, "id" | "name">[]).map((s) => [s.id, s.name]));
  const tipo = TIPOS.find((t) => t === searchParams.tipo) ?? null;
  return <EventosVista todos={(ev ?? []) as EventRow[]} refugios={refugios} tipo={tipo} />;
}
