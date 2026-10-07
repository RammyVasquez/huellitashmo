import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnimalGallery from "@/components/AnimalGallery";
import ShareButtons from "@/components/ShareButtons";
import ShelterBadges from "@/components/ShelterBadges";
import { supabase } from "@/lib/supabase";
import type { Shelter, Story } from "@/lib/types";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function cargar(id: string) {
  if (!UUID.test(id)) return null;
  const { data } = await supabase.from("stories").select("*").eq("id", id).eq("status", "publicada").maybeSingle();
  return (data as Story | null) ?? null;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const h = await cargar(params.id);
  if (!h) return { title: "Historia no encontrada · Huellitas HMO" };
  const foto = h.photos?.[0];
  return {
    title: `${h.title} · Huellitas HMO`,
    description: h.body.slice(0, 160),
    openGraph: { title: h.title, description: h.body.slice(0, 160), images: foto ? [{ url: foto }] : undefined },
    twitter: { card: "summary_large_image", title: h.title, description: h.body.slice(0, 160), images: foto ? [foto] : undefined },
  };
}

export default async function Historia({ params }: { params: { id: string } }) {
  const h = await cargar(params.id);
  if (!h) notFound();
  const { data: sh } = await supabase.from("shelters").select("*").eq("id", h.shelter_id).maybeSingle();
  const refugio = (sh as Shelter | null) ?? null;

  return (
    <div className="wrap page">
      <p><Link href="/historias">← Todas las historias</Link></p>
      <div className="ficha">
        <AnimalGallery photos={h.photos ?? []} name={h.title} />
        <div>
          <span className="tag ok">Encontró hogar</span>
          <h1 style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>{h.title}</h1>
          {h.family_label && <p className="muted">{h.family_label}</p>}
          <p className="lead" style={{ whiteSpace: "pre-line" }}>{h.body}</p>
          {refugio && (
            <div className="box">
              <h3 style={{ marginTop: 0 }}><Link href={`/refugios/${refugio.id}`}>{refugio.name}</Link></h3>
              <p><ShelterBadges kind={refugio.kind} verifiedAt={refugio.verified_at} /></p>
              <p className="muted" style={{ margin: 0 }}>Gracias al refugio por el rescate y a la familia por abrir su casa.</p>
            </div>
          )}
          <div className="actions"><Link className="btn" href="/animales">Conoce a quienes aún esperan</Link></div>
          <ShareButtons text={h.title} />
        </div>
      </div>
    </div>
  );
}
