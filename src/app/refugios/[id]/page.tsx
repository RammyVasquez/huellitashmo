import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnimalCard from "@/components/AnimalCard";
import FacebookFeed from "@/components/FacebookFeed";
import ShareButtons from "@/components/ShareButtons";
import ShelterMiniMap from "@/components/ShelterMiniMap";
import { getShelter } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { Animal, ShelterNeed } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const s = await getShelter(params.id);
  if (!s) return { title: "Refugio no encontrado · Huellitas HMO" };
  const title = `${s.name} · Refugio en Hermosillo`;
  const description = s.about?.slice(0, 160) ?? `Conoce a ${s.name}, sus animales y cómo ayudarlo.`;
  return {
    title: `${title} · Huellitas HMO`,
    description,
    openGraph: { title, description, images: s.logo_url ? [{ url: s.logo_url }] : undefined },
    twitter: { card: "summary", title, description, images: s.logo_url ? [s.logo_url] : undefined },
  };
}

export default async function Refugio({ params }: { params: { id: string } }) {
  const s = await getShelter(params.id);
  if (!s) notFound();

  const [{ data: an }, { data: nd }] = await Promise.all([
    supabase.from("animals").select("*").eq("shelter_id", s.id).order("created_at", { ascending: false }),
    supabase.from("shelter_needs").select("*").eq("shelter_id", s.id).eq("fulfilled", false).order("urgent", { ascending: false }),
  ]);
  const animals = (an ?? []) as Animal[];
  const needs = (nd ?? []) as ShelterNeed[];
  const disponibles = animals.filter((a) => a.status !== "adoptado");
  const adoptados = animals.filter((a) => a.status === "adoptado").length;

  const wa = s.whatsapp
    ? `https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Hola, los encontré en Huellitas HMO y quisiera más información.")}`
    : null;
  const dir = s.lat != null && s.lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`
    : s.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address + ", Hermosillo, Sonora")}` : null;

  return (
    <div className="wrap page">
      <p><Link href="/refugios">← Todos los refugios</Link></p>

      <div className="shelter-head" style={{ gap: "1.4rem" }}>
        {s.logo_url ? <img className="logo big" src={s.logo_url} alt={`Logo de ${s.name}`} /> : <span className="logo big fallback" aria-hidden="true">{s.name.trim().charAt(0).toUpperCase()}</span>}
        <div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", marginBottom: ".4rem" }}>{s.name}</h1>
          <span className="tag">{animals.length} {animals.length === 1 ? "animal registrado" : "animales registrados"}</span>
          {adoptados > 0 && <span className="tag ok">{adoptados} {adoptados === 1 ? "adoptado" : "adoptados"}</span>}
        </div>
      </div>

      {s.about && <p className="lead">{s.about}</p>}

      <div className="actions">
        {wa && <a className="btn" href={wa}>Escribirles por WhatsApp</a>}
        {s.facebook_url && <a className="btn ghost" href={s.facebook_url} target="_blank" rel="noopener noreferrer">Facebook</a>}
        {s.instagram_url && <a className="btn ghost" href={s.instagram_url} target="_blank" rel="noopener noreferrer">Instagram</a>}
      </div>

      <section className="section">
        <h2>Ellos buscan casa</h2>
        {disponibles.length === 0 ? (
          <div className="empty">Por ahora no hay animales disponibles en este refugio.</div>
        ) : (
          <div className="grid">{disponibles.map((a) => <AnimalCard key={a.id} a={a} />)}</div>
        )}
      </section>

      <section className="section">
        <h2>Cómo ayudarlos sin dinero</h2>
        {needs.length === 0 ? (
          <p className="muted">Sin lista publicada. Escríbeles para preguntar qué les hace falta.</p>
        ) : (
          <ul>
            {needs.map((n) => (
              <li key={n.id}>
                <b>{n.item}</b> {n.urgent && <span className="tag urgente">urgente</span>}
                {n.detail && <span className="muted"> · {n.detail}</span>}
              </li>
            ))}
          </ul>
        )}
        {(s.address || s.drop_off_hours) && (
          <div className="box">
            {s.address && <p style={{ margin: 0 }}><b>Dónde entregar:</b> {s.address}</p>}
            {s.drop_off_hours && <p style={{ margin: 0 }}><b>Horario:</b> {s.drop_off_hours}</p>}
          </div>
        )}
        {s.lat != null && s.lng != null && <ShelterMiniMap id={s.id} name={s.name} lat={s.lat} lng={s.lng} />}
        {dir && <p><a className="btn alt" href={dir} target="_blank" rel="noopener noreferrer">Cómo llegar</a></p>}
      </section>

      {s.facebook_url && (
        <section className="section">
          <h2>Su día a día en Facebook</h2>
          <FacebookFeed pageUrl={s.facebook_url} name={s.name} />
        </section>
      )}

      <ShareButtons text={`Conoce a ${s.name}, refugio de Hermosillo`} />
    </div>
  );
}
