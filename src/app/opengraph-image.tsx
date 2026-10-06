import { ImageResponse } from "next/og";
import { TarjetaOg } from "@/lib/og-tarjeta";
import { supabase } from "@/lib/supabase";

export const alt = "Huellitas HMO · Adopta, apadrina y ayuda en Hermosillo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

// Descarga la foto con límite de tiempo y la convierte a data URI. Si algo falla, se omite (la tarjeta nunca se rompe).
async function comoDataUri(url: string): Promise<string | null> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    const tipo = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(jpeg|png)/.test(tipo)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 1_500_000) return null;
    return `data:${tipo.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

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
