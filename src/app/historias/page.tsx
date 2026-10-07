import Link from "next/link";
import FotoFit from "@/components/FotoFit";
import { supabase } from "@/lib/supabase";
import type { Story } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Encontraron hogar · Huellitas HMO", description: "Historias de animales que encontraron una familia en Hermosillo." };

export default async function Historias() {
  const { data } = await supabase.from("stories").select("*").eq("status", "publicada").order("published_at", { ascending: false });
  const historias = (data ?? []) as Story[];
  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Encontraron hogar</h1>
      <p className="lead">Cada historia es un animal que hoy duerme en una casa. Se publican con la autorización de las familias.</p>
      {historias.length === 0 ? (
        <div className="empty">Pronto compartiremos aquí las primeras historias de adopción.</div>
      ) : (
        <div className="grid">
          {historias.map((h) => (
            <Link key={h.id} href={`/historias/${h.id}`} className="card">
              {h.photos?.[0] ? <FotoFit src={h.photos[0]} alt={h.title} /> : <div className="ph" />}
              <div className="body">
                <h3>{h.title}</h3>
                <p className="clamp muted" style={{ margin: 0 }}>{h.body}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
