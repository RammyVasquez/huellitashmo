import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Animal, Shelter } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AnimalDetalle({ params }: { params: { id: string } }) {
  const { data } = await supabase.from("animals").select("*").eq("id", params.id).single();
  if (!data) notFound();
  const a = data as Animal;

  let shelter: Shelter | null = null;
  if (a.shelter_id) {
    const r = await supabase.from("shelters").select("*").eq("id", a.shelter_id).single();
    shelter = (r.data as Shelter) ?? null;
  }

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
          </p>
          {a.description && <p className="lead">{a.description}</p>}

          {a.status !== "adoptado" && (
            <div className="actions">
              {adoptar && <a className="btn" href={adoptar}>Quiero adoptar a {a.name}</a>}
              {a.sponsorable && apadrinar && <a className="btn alt" href={apadrinar}>Apadrinar en especie</a>}
            </div>
          )}
          {!shelter?.whatsapp && <p className="muted">Este refugio aún no registró un contacto por WhatsApp.</p>}
          {a.sponsors > 0 && <p className="muted">{a.name} ya tiene {a.sponsors} {a.sponsors === 1 ? "padrino" : "padrinos"}.</p>}

          {shelter && (
            <div className="box">
              <h3>{shelter.name}</h3>
              {shelter.address && <p>{shelter.address}</p>}
              <p className="muted" style={{ margin: 0 }}>
                ¿Es tu primera adopción? Lee <Link href="/adopta">cómo funciona y qué te pedirán</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
