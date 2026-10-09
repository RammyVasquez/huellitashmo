import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PhotoStrip from "@/components/PhotoStrip";
import ShareButtons from "@/components/ShareButtons";
import InformarForm from "@/components/InformarForm";
import { supabase } from "@/lib/supabase";
import { fechaCorta } from "@/lib/util";
import type { PublicReport } from "@/lib/types";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function cargar(id: string) {
  if (!UUID.test(id)) return null;
  const { data } = await supabase.from("reports_public").select("*").eq("id", id).maybeSingle();
  return (data as PublicReport | null) ?? null;
}

const titulo = (r: PublicReport) =>
  r.status === "reunificado" ? `¡Volvió a casa! ${r.species} (${r.zone ?? "Hermosillo"})`
  : r.kind === "perdido" ? `Se busca ${r.species} perdido en ${r.zone ?? "Hermosillo"}`
  : `Se encontró un ${r.species} en ${r.zone ?? "Hermosillo"}`;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await cargar(params.id);
  if (!r) return { title: "Reporte no encontrado · Huellitas HMO" };
  const foto = r.photos?.[0] ?? r.photo_url;
  const descripcion = r.description.slice(0, 160);
  return {
    title: `${titulo(r)} · Huellitas HMO`,
    description: descripcion,
    openGraph: { title: titulo(r), description: descripcion, images: foto ? [{ url: foto }] : undefined },
    twitter: { card: "summary_large_image", title: titulo(r), description: descripcion, images: foto ? [foto] : undefined },
  };
}

export default async function FichaReporte({ params }: { params: { id: string } }) {
  const r = await cargar(params.id);
  if (!r) notFound();
  const fotos = r.photos?.length ? r.photos : r.photo_url ? [r.photo_url] : [];
  const activo = r.status === "activo";

  return (
    <div className="wrap page">
      <p><Link href="/reportes">← Perdidos y encontrados</Link></p>
      <div className="ficha">
        <div className="card" style={{ boxShadow: "none" }}><PhotoStrip photos={fotos} alt={`Mascota ${r.kind}`} /></div>
        <div>
          {r.status === "reunificado" && <p className="alertbox" style={{ background: "#dff3ea", color: "#14513a" }}><b>¡Volvió a casa!</b> Este caso ya se resolvió. Gracias por compartir.</p>}
          <h1 style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>{titulo(r)}</h1>
          <p>
            <span className={`tag ${r.kind}`}>{r.kind}</span>
            <span className="tag">{r.species}</span>
            <span className="muted"> {r.zone} · {fechaCorta(r.created_at)}</span>
          </p>
          <p className="lead">{r.description}</p>
          {activo && (
            <div className="actions">
              {r.has_contact !== false && <a className="btn" href={`/api/contacto/${r.id}`}>{r.kind === "perdido" ? "Vi a esta mascota" : "Es mi mascota"}</a>}
              <Link className="btn ghost" href={`/reportes/${r.id}/cartel`}>Imprimir cartel</Link>
              <Link className="btn ghost" href={`/reportes/${r.id}/kit`}>Imagen y texto para compartir</Link>
            </div>
          )}
          {activo && r.has_contact === false && <InformarForm reportId={r.id} perdido={r.kind === "perdido"} />}
          {r.kind === "encontrado" && activo && r.has_contact !== false && (
            <p className="muted">Por seguridad, quien la encontró te pedirá un detalle que no aparece aquí para confirmar que es tu mascota.</p>
          )}
          <ShareButtons text={titulo(r)} />
        </div>
      </div>
    </div>
  );
}
