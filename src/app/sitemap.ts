import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const fijas = ["", "/animales", "/refugios", "/donar", "/adopta", "/match", "/reportes", "/rescate", "/primeros-auxilios", "/impacto", "/privacidad", "/reglas"];
  const [a, s, r] = await Promise.all([
    supabase.from("animals").select("id").neq("status", "adoptado"),
    supabase.from("shelters").select("id"),
    supabase.from("reports_public").select("id").eq("status", "activo"),
  ]);
  return [
    ...fijas.map((p) => ({ url: `${base}${p}` })),
    ...(a.data ?? []).map((x: { id: string }) => ({ url: `${base}/animales/${x.id}` })),
    ...(s.data ?? []).map((x: { id: string }) => ({ url: `${base}/refugios/${x.id}` })),
    ...(r.data ?? []).map((x: { id: string }) => ({ url: `${base}/reportes/${x.id}` })),
  ];
}
