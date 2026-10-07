import Link from "next/link";
import { notFound } from "next/navigation";
import KitCompartir from "@/components/KitCompartir";
import { getAnimal, getShelter } from "@/lib/data";
import { nombreArchivo, textoKit } from "@/lib/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kit para compartir · Huellitas HMO", robots: { index: false } };

export default async function Kit({ params }: { params: { id: string } }) {
  const a = await getAnimal(params.id);
  if (!a) notFound();
  const refugio = a.shelter_id ? await getShelter(a.shelter_id) : null;
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return (
    <div className="wrap page">
      <p><Link href={`/animales/${a.id}`}>← Volver a la ficha de {a.name}</Link></p>
      <h1 style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>Kit para compartir a {a.name}</h1>
      <p className="lead">Una imagen cuadrada y un texto listos para publicar en Facebook, Instagram o WhatsApp.</p>
      <KitCompartir id={a.id} nombre={a.name} textoInicial={textoKit(a, refugio?.name ?? null, `${sitio}/animales/${a.id}?ref=kit`)} archivo={nombreArchivo(a.name)} />
    </div>
  );
}
