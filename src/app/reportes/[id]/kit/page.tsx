import Link from "next/link";
import { notFound } from "next/navigation";
import KitCompartir from "@/components/KitCompartir";
import { textoKitReporte, tituloReporte } from "@/lib/kit";
import { supabase } from "@/lib/supabase";
import type { PublicReport } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compartir un reporte · Huellitas HMO", robots: { index: false } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function KitReporte({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound();
  const { data } = await supabase.from("reports_public").select("*").eq("id", params.id).maybeSingle();
  const r = data as PublicReport | null;
  if (!r) notFound();
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const enlace = r.code ? `${sitio}/r/${r.code}?ref=kit` : `${sitio}/reportes/${r.id}?ref=kit`;
  const fecha = new Date(r.created_at).toLocaleDateString("es-MX", { timeZone: "America/Hermosillo", day: "numeric", month: "long" });

  return (
    <div className="wrap page">
      <p><Link href={`/reportes/${r.id}`}>← Volver al reporte</Link></p>
      <h1 style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>Compartir: {tituloReporte(r).toLowerCase()}</h1>
      <p className="lead">Una imagen cuadrada y un texto listos para publicar en los grupos de tu colonia, en Facebook y por WhatsApp. No incluye ningún teléfono: quien tenga información entra desde el enlace.</p>
      <KitCompartir id={r.id} nombre={tituloReporte(r)} imagen={`/api/kit-reporte/${r.id}/imagen`} textoInicial={textoKitReporte(r, enlace, fecha)} archivo={`huellitas-${r.kind}-${r.id.slice(0, 8)}`} />
    </div>
  );
}
