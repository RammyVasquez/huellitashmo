import QRCode from "qrcode";
import Link from "next/link";
import { notFound } from "next/navigation";
import CartelEditor from "@/components/CartelEditor";
import { supabase } from "@/lib/supabase";
import type { PublicReport } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cartel · Huellitas HMO", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Cartel({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound();
  const { data } = await supabase.from("reports_public").select("*").eq("id", params.id).maybeSingle();
  const r = data as PublicReport | null;
  if (!r || r.status !== "activo" || !r.code) notFound();

  const sitio = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  // El QR lleva a la ficha pública: el teléfono de la familia nunca aparece en el cartel
  const qrSvg = await QRCode.toString(`${sitio}/r/${r.code}?ref=cartel`, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  const fotos = (r.photos?.length ? r.photos : r.photo_url ? [r.photo_url] : []).slice(0, 3);

  return (
    <div className="wrap page cartel-pagina">
      <p className="no-print"><Link href={`/reportes/${r.id}`}>← Volver al reporte</Link></p>
      <CartelEditor
        tipo={r.kind}
        especie={r.species === "perro" ? "Perro" : r.species === "gato" ? "Gato" : "Mascota"}
        zona={r.zone ?? "Hermosillo"}
        descripcion={r.description}
        fotos={fotos}
        qrSvg={qrSvg}
        ligaCorta={`${sitio.replace(/^https?:\/\//, "")}/r/${r.code}`}
      />
    </div>
  );
}
