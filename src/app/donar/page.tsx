import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DonarExplorer from "@/components/DonarExplorer";
import type { Shelter, ShelterNeed } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dona en especie · Huellitas HMO" };

export default async function Donar() {
  const [{ data: sh }, { data: nd }] = await Promise.all([
    supabase.from("shelters").select("*").order("name"),
    supabase.from("shelter_needs").select("*").eq("fulfilled", false).order("urgent", { ascending: false }),
  ]);
  const shelters = (sh ?? []) as Shelter[];
  const needs = (nd ?? []) as ShelterNeed[];

  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Dona en especie</h1>
      <p className="lead">
        Aquí no pedimos dinero. Esta plataforma no recibe ni maneja pagos: llevas tu donativo directo al refugio
        que te quede más cerca y ellos lo usan para sus animales.
      </p>

      {shelters.length === 0 ? (
        <div className="empty">Aún no hay refugios registrados. Vuelve pronto.</div>
      ) : (
        <DonarExplorer shelters={shelters} needs={needs} />
      )}

      <section className="section">
        <div className="band">
          <h3>¿Prefieres ayudar a un animal en particular?</h3>
          <p>Apadrina a un lomito: te comprometes a cubrir en especie algo de su cuidado, como su comida del mes.</p>
          <Link className="btn" href="/animales?apadrinar=1">Ver animales para apadrinar</Link>
        </div>
      </section>
    </div>
  );
}
