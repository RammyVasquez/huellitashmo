import { notFound } from "next/navigation";
import FollowupForm from "@/components/FollowupForm";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seguimiento de adopción · Huellitas HMO", robots: { index: false, follow: false } };

type Fila = { status: string; stage: number; adoption_requests: { animals: { name: string; photo_url: string | null } | null } | null };

export default async function Seguimiento({ params }: { params: { token: string } }) {
  if (!/^[0-9a-f]{64}$/.test(params.token)) notFound();
  const { data } = await supabaseAdmin()
    .from("adoption_followups")
    .select("status, stage, adoption_requests(animals(name, photo_url))")
    .eq("token", params.token)
    .single();
  const f = data as unknown as Fila | null;
  if (!f) notFound();

  const animal = f.adoption_requests?.animals;
  const nombre = animal?.name ?? "tu mascota";

  return (
    <div className="wrap page">
      <div className="shelter-head" style={{ gap: "1.2rem" }}>
        {animal?.photo_url && <img className="logo big" src={animal.photo_url} alt={`Foto de ${nombre}`} />}
        <h1 style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>¿Cómo está {nombre}?</h1>
      </div>
      {f.status === "respondido" || f.status === "omitido" ? (
        <p className="lead">Ya recibimos tu respuesta para este seguimiento. ¡Gracias por cuidar a {nombre}!</p>
      ) : (
        <>
          <p className="lead">Hace {f.stage} {f.stage === 1 ? "mes" : "meses"} que {nombre} llegó a casa. Nos encantaría saber cómo le va. Son dos minutos.</p>
          <div style={{ maxWidth: 680 }}><FollowupForm token={params.token} animalName={nombre} /></div>
        </>
      )}
    </div>
  );
}
