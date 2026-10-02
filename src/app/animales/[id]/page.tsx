import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShareButtons from "@/components/ShareButtons";
import { getAnimal, getShelter } from "@/lib/data";

export const dynamic = "force-dynamic";

const EDAD = { cachorro: "Cachorro", joven: "Joven", adulto: "Adulto", senior: "Senior" } as const;
const TAMANO = { pequeno: "Pequeño", mediano: "Mediano", grande: "Grande" } as const;
const ENERGIA = { tranquilo: "Tranquilo", moderado: "Energía moderada", activo: "Muy activo" } as const;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const a = await getAnimal(params.id);
  if (!a) return { title: "Animal no encontrado · Huellitas HMO" };
  const title = a.status === "adoptado" ? `${a.name} ya encontró hogar` : `${a.name} busca hogar en Hermosillo`;
  const description = a.description?.slice(0, 160) ?? `Conoce a ${a.name} y ayúdalo a encontrar una familia.`;
  return {
    title: `${title} · Huellitas HMO`,
    description,
    openGraph: { title, description, type: "article", images: a.photo_url ? [{ url: a.photo_url }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: a.photo_url ? [a.photo_url] : undefined },
  };
}

export default async function AnimalDetalle({ params }: { params: { id: string } }) {
  const a = await getAnimal(params.id);
  if (!a) notFound();
  const shelter = a.shelter_id ? await getShelter(a.shelter_id) : null;

  const wa = (msg: string) =>
    shelter?.whatsapp ? `https://wa.me/${shelter.whatsapp}?text=${encodeURIComponent(msg)}` : null;
  const adoptar = wa(`Hola, me interesa adoptar a ${a.name} (vi su perfil en Huellitas HMO).`);
  const apadrinar = wa(`Hola, quiero apadrinar a ${a.name} con un donativo en especie (vi su perfil en Huellitas HMO). ¿Qué necesita?`);

  return (
    <div className="wrap page">
      <p><Link href="/animales">← Todos los animales</Link></p>
      <div className="ficha">
        {a.photo_url ? <img src={a.photo_url} alt={`Foto de ${a.name}`} /> : <div className="box" style={{ aspectRatio: "4/5" }} />}
        <div>
          <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.2rem)" }}>{a.name}</h1>
          <p>
            <span className="tag">{a.species}</span>
            {a.sex && <span className="tag">{a.sex}</span>}
            {a.age_text && <span className="tag">{a.age_text}</span>}
            {a.sterilized && <span className="tag ok">esterilizado</span>}
            {a.vaccinated && <span className="tag ok">vacunado</span>}
            {a.status === "en_proceso" && <span className="tag urgente">adopción en proceso</span>}
            {a.status === "adoptado" && <span className="tag ok">¡ya encontró hogar!</span>}
          </p>
          {(a.age_group || a.size || a.energy || a.good_kids || a.good_pets) && (
            <p>
              {a.age_group && <span className="tag">{EDAD[a.age_group]}</span>}
              {a.size && <span className="tag">{TAMANO[a.size]}</span>}
              {a.energy && <span className="tag">{ENERGIA[a.energy]}</span>}
              {a.good_kids === "si" && <span className="tag ok">se lleva bien con niños</span>}
              {a.good_kids === "no" && <span className="tag perdido">mejor sin niños</span>}
              {a.good_pets === "si" && <span className="tag ok">se lleva bien con otros animales</span>}
              {a.good_pets === "no" && <span className="tag perdido">mejor sin otros animales</span>}
            </p>
          )}
          {a.description && <p className="lead">{a.description}</p>}

          {a.status !== "adoptado" && (
            <div className="actions">
              {adoptar && <a className="btn" href={adoptar}>Quiero adoptar a {a.name}</a>}
              {a.sponsorable && apadrinar && <a className="btn alt" href={apadrinar}>Apadrinar en especie</a>}
            </div>
          )}
          {!shelter?.whatsapp && a.status !== "adoptado" && <p className="muted">Este refugio aún no registró un contacto por WhatsApp.</p>}
          {a.sponsors > 0 && <p className="muted">{a.name} ya tiene {a.sponsors} {a.sponsors === 1 ? "padrino" : "padrinos"}.</p>}

          {shelter && (
            <div className="box">
              <h3><Link href={`/refugios/${shelter.id}`}>{shelter.name}</Link></h3>
              {shelter.address && <p>{shelter.address}</p>}
              <p className="muted" style={{ margin: 0 }}>
                ¿Es tu primera adopción? Lee <Link href="/adopta">cómo funciona y qué te pedirán</Link>.
              </p>
            </div>
          )}

          <ShareButtons text={a.status === "adoptado" ? `${a.name} ya encontró hogar` : `${a.name} busca hogar en Hermosillo`} />
        </div>
      </div>
    </div>
  );
}
