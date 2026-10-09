import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { ctaKit, etiquetasKit, nombreArchivo } from "@/lib/kit";
import { TarjetaKit } from "@/lib/kit-tarjeta";
import { fuenteGoogle } from "@/lib/server/fuente";
import { fotoConMedidas } from "@/lib/server/foto";
import { supabase } from "@/lib/supabase";
import type { Animal } from "@/lib/types";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Imagen cuadrada lista para publicar. ?descargar=1 la baja como archivo.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return new Response("No encontrado", { status: 404 });
  const { data } = await supabase.from("animals").select("*").eq("id", params.id).maybeSingle();
  const a = data as Animal | null;
  if (!a) return new Response("No encontrado", { status: 404 });

  let refugio: string | null = null;
  if (a.shelter_id) {
    const { data: sh } = await supabase.from("shelters").select("name").eq("id", a.shelter_id).maybeSingle();
    refugio = sh?.name ?? null;
  }
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const url = a.photos?.[0] ?? a.photo_url;
  const [foto, qr, fuente] = await Promise.all([
    url ? fotoConMedidas(url) : Promise.resolve(null),
    QRCode.toDataURL(`${sitio}/animales/${a.id}?ref=kit`, { margin: 1, width: 320, errorCorrectionLevel: "M" }).catch(() => null),
    fuenteGoogle("Fredoka", 600, `${a.name}Huellitas HMO Busca hogar Se está recuperando ¡Ya tiene hogar!`),
  ]);

  const descargar = new URL(req.url).searchParams.get("descargar") === "1";
  return new ImageResponse(
    <TarjetaKit d={{ nombre: a.name, foto, etiquetas: etiquetasKit(a), refugio, estado: a.status === "adoptado" ? "adoptado" : a.status === "en_cuidados" ? "en_cuidados" : "disponible", cta: ctaKit(a), qr }} />,
    {
      width: 1080,
      height: 1080,
      fonts: fuente ? [{ name: "Fredoka", data: fuente, weight: 600, style: "normal" }] : undefined,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...(descargar ? { "Content-Disposition": `attachment; filename="${nombreArchivo(a.name)}.png"` } : {}),
      },
    }
  );
}
