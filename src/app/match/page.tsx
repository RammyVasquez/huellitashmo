import { supabase } from "@/lib/supabase";
import MatchQuiz from "@/components/MatchQuiz";
import type { Animal } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Encuentra tu match · Huellitas HMO" };

export default async function Match() {
  const { data } = await supabase.from("animals").select("*").neq("status", "adoptado").order("created_at", { ascending: false });
  const animals = (data ?? []) as Animal[];

  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Encuentra tu match</h1>
      <p className="lead">Responde 5 preguntas sobre tu casa y tu ritmo de vida, y te sugerimos a quién conocer primero.</p>
      <div className="form-card" style={{ maxWidth: 680 }}>
        {animals.length === 0 ? (
          <div className="empty">Aún no hay animales registrados. Vuelve pronto.</div>
        ) : (
          <MatchQuiz animals={animals} />
        )}
      </div>
    </div>
  );
}
