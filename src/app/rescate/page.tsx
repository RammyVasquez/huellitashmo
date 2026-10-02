import Link from "next/link";
import HelpContacts from "@/components/HelpContacts";
import RescueExplorer from "@/components/RescueExplorer";
import { supabase } from "@/lib/supabase";
import type { HelpContact, WelfarePublic } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Animales que necesitan ayuda · Huellitas HMO" };

export default async function Rescate() {
  const [{ data: cs }, { data: ct }] = await Promise.all([
    supabase.from("welfare_public").select("*").order("urgent", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("help_contacts").select("*").order("sort").order("name"),
  ]);
  const cases = (cs ?? []) as WelfarePublic[];
  const contacts = (ct ?? []) as HelpContact[];

  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Animales que necesitan ayuda</h1>
      <p className="lead">
        Perros y gatos heridos o enfermos en las calles de Hermosillo. Si viste uno, avísanos; si puedes ayudar, aquí están los casos activos.
      </p>
      <div className="actions">
        <Link className="btn" href="/rescate/nuevo">Reportar un animal en riesgo</Link>
      </div>
      <p className="muted" style={{ maxWidth: "62ch" }}>
        Los reportes de maltrato, abandono o encierro no se publican: los revisa nuestro equipo y los canaliza para proteger a todas las personas involucradas.
      </p>
      <HelpContacts contacts={contacts} />
      <section className="section">
        <h2>Casos activos</h2>
        <RescueExplorer cases={cases} />
      </section>
    </div>
  );
}
