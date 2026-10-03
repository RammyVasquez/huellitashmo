import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AnimalsExplorer from "@/components/AnimalsExplorer";
import type { Animal } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Animales({
  searchParams,
}: {
  searchParams: { apadrinar?: string; especie?: string };
}) {
  const apadrinar = !!searchParams.apadrinar;
  let q = supabase.from("animals").select("*").neq("status", "adoptado").order("created_at", { ascending: false });
  if (apadrinar) q = q.eq("sponsorable", true);
  const { data } = await q;
  const animals = (data ?? []) as Animal[];

  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>{apadrinar ? "Apadrina a un lomito" : "Ellos esperan una familia"}</h1>
      <p className="lead">
        {apadrinar
          ? "Apadrinar es comprometerte a cubrir algo de su cuidado en especie, como su comida del mes o su vacuna. El refugio te dirá qué necesita y cómo entregarlo."
          : "Animales de refugios de Hermosillo que hoy buscan hogar. Si alguno te llama la atención, escríbele al refugio desde su ficha."}
      </p>
      {!apadrinar && (
        <p className="band" style={{ padding: "1rem 1.3rem" }}>
          <b>¿No sabes a cuál elegir?</b> Responde 5 preguntas y te sugerimos a quién conocer primero.{" "}
          <Link href="/match">Encuentra tu match</Link>
        </p>
      )}
      <AnimalsExplorer animals={animals} especieInicial={searchParams.especie} />
    </div>
  );
}
