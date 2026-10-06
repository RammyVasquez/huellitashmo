import Link from "next/link";
import { notFound } from "next/navigation";
import AdoptionForm from "@/components/AdoptionForm";
import { getAnimal, getShelter } from "@/lib/data";
import { nombreTipo } from "@/lib/refugios";

export const dynamic = "force-dynamic";
export const metadata = { title: "Solicitud de adopción · Huellitas HMO", robots: { index: false } };

export default async function Adoptar({ params }: { params: { id: string } }) {
  const a = await getAnimal(params.id);
  if (!a) notFound();
  const shelter = a.shelter_id ? await getShelter(a.shelter_id) : null;

  if (a.status === "adoptado")
    return (
      <div className="wrap page">
        <h1>{a.name} ya encontró hogar</h1>
        <p className="lead">¡Qué buena noticia! Mira a otros animales que esperan una familia.</p>
        <div className="actions"><Link className="btn" href="/animales">Ver animales</Link></div>
      </div>
    );

  return (
    <div className="wrap page">
      <p><Link href={`/animales/${a.id}`}>← Volver a la ficha de {a.name}</Link></p>
      <div className="shelter-head" style={{ gap: "1.2rem" }}>
        {a.photo_url && <img className="logo big" src={a.photo_url} alt={`Foto de ${a.name}`} />}
        <div>
          <h1 style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)", marginBottom: ".3rem" }}>Solicitud para adoptar a {a.name}</h1>
          {shelter && <p className="muted" style={{ margin: 0 }}>{nombreTipo(shelter.kind)}: {shelter.name}</p>}
        </div>
      </div>
      <p className="lead">Son unas preguntas sencillas para que el refugio conozca a tu familia y encuentre el mejor hogar. Tarda unos 5 minutos.</p>
      <div style={{ maxWidth: 720 }}>
        <AdoptionForm animalId={a.id} animalName={a.name} shelterName={shelter?.name ?? null} />
      </div>
    </div>
  );
}
