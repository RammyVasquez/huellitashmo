import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { zonaPublica } from "@/lib/kit";
import { TarjetaReporte } from "@/lib/kit-reporte-tarjeta";
import { fuenteGoogle } from "@/lib/server/fuente";
import { fotoConMedidas } from "@/lib/server/foto";
import { supabase } from "@/lib/supabase";
import type { PublicReport } from "@/lib/types";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const corta = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { timeZone: "America/Hermosillo", day: "numeric", month: "short" }).replace(".", "");

// Imagen cuadrada de una mascota perdida o encontrada. Solo usa datos públicos: nunca incluye teléfono ni la dirección exacta.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return new Response("No encontrado", { status: 404 });
  const { data } = await supabase.from("reports_public").select("*").eq("id", params.id).maybeSingle();
  const r = data as PublicReport | null;
  if (!r) return new Response("No encontrado", { status: 404 });

  const sitio = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const enlace = r.code ? `${sitio}/r/${r.code}?ref=kit` : `${sitio}/reportes/${r.id}?ref=kit`;
  const url = r.photos?.[0] ?? r.photo_url;
  const zona = zonaPublica(r.zone, r.kind);
  const [foto, qr, fuente] = await Promise.all([
    url ? fotoConMedidas(url) : Promise.resolve(null),
    QRCode.toDataURL(enlace, { margin: 1, width: 320, errorCorrectionLevel: "M" }).catch(() => null),
    fuenteGoogle("Fredoka", 600, `¿Es tu perro gato mascota? Lo La has visto Se perdió encontró en Huellitas HMO ${zona}`),
  ]);

  const descargar = new URL(req.url).searchParams.get("descargar") === "1";
  return new ImageResponse(
    <TarjetaReporte d={{ kind: r.kind, especie: r.species, foto, zona, fecha: corta(r.created_at), qr }} />,
    {
      width: 1080, height: 1080,
      fonts: fuente ? [{ name: "Fredoka", data: fuente, weight: 600, style: "normal" }] : undefined,
      headers: { "Cache-Control": "public, max-age=300", ...(descargar ? { "Content-Disposition": `attachment; filename="${r.kind}-${r.id.slice(0, 8)}.png"` } : {}) },
    }
  );
}
