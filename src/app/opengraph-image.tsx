import { ImageResponse } from "next/og";
import { TarjetaOg } from "@/lib/og-tarjeta";
import { comoDataUri } from "@/lib/server/foto";
import { supabase } from "@/lib/supabase";

export const alt = "Huellitas HMO · Adopta, apadrina y ayuda en Hermosillo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image() {
  let fotos: string[] = [];
  try {
    const { data } = await supabase
      .from("animals").select("photo_url").neq("status", "adoptado").not("photo_url", "is", null)
      .order("created_at", { ascending: false }).limit(3);
    const urls = (data ?? []).map((d: { photo_url: string | null }) => d.photo_url).filter((u): u is string => !!u);
    fotos = (await Promise.all(urls.map(comoDataUri))).filter((u): u is string => !!u);
  } catch {
    fotos = [];
  }
  return new ImageResponse(<TarjetaOg fotos={fotos} />, size);
}
