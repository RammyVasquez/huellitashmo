import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AnimalCard from "@/components/AnimalCard";
import type { Animal } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Animales({
  searchParams,
}: {
  searchParams: { apadrinar?: string; especie?: string };
}) {
  const apadrinar = !!searchParams.apadrinar;
  const especie = searchParams.especie;
  let q = supabase.from("animals").select("*").neq("status", "adoptado").order("created_at", { ascending: false });
  if (apadrinar) q = q.eq("sponsorable", true);
  if (especie === "perro" || especie === "gato") q = q.eq("species", especie);
  const { data } = await q;
  const animals = (data ?? []) as Animal[];

  const base = apadrinar ? "/animales?apadrinar=1&" : "/animales?";

  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>{apadrinar ? "Apadrina a un lomito" : "Ellos esperan una familia"}</h1>
      <p className="lead">
        {apadrinar
          ? "Apadrinar es comprometerte a cubrir algo de su cuidado en especie, como su comida del mes o su vacuna. El refugio te dirá qué necesita y cómo entregarlo."
          : "Animales de refugios de Hermosillo que hoy buscan hogar. Si alguno te llama la atención, escríbele al refugio desde su ficha."}
      </p>
      <div className="chips">
        <Link href={apadrinar ? "/animales?apadrinar=1" : "/animales"} aria-current={!especie}>Todos</Link>
        <Link href={`${base}especie=perro`} aria-current={especie === "perro"}>Perros</Link>
        <Link href={`${base}especie=gato`} aria-current={especie === "gato"}>Gatos</Link>
      </div>
      {animals.length === 0 ? (
        <div className="empty">No encontramos animales con este filtro. Prueba con otro o vuelve pronto.</div>
      ) : (
        <div className="grid">{animals.map((a) => <AnimalCard key={a.id} a={a} />)}</div>
      )}
    </div>
  );
}
