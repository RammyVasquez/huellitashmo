import { supabase } from "@/lib/supabase";
import ReportsExplorer from "@/components/ReportsExplorer";
import type { PublicReport } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Perdidos y encontrados · Huellitas HMO" };

export default async function Reportes() {
  const { data } = await supabase
    .from("reports_public")
    .select("*")
    .eq("status", "activo")
    .order("created_at", { ascending: false });
  const reports = (data ?? []) as PublicReport[];

  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Perdidos y encontrados</h1>
      <p className="lead">
        Mira en el mapa dónde se perdió o se encontró una mascota. Si reconoces a alguna, escribe a quien la reportó.
      </p>
      <ReportsExplorer reports={reports} />
    </div>
  );
}
