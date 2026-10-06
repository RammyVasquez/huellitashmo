import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// /r/ab12cd34ef lleva a la ficha del reporte (la liga que va impresa en los carteles)
export default async function LigaCorta({ params, searchParams }: { params: { code: string }; searchParams: { ref?: string } }) {
  if (!/^[0-9a-f]{10}$/i.test(params.code)) notFound();
  const { data } = await supabase.from("reports_public").select("id").eq("code", params.code.toLowerCase()).limit(1).maybeSingle();
  if (!data) notFound();
  const ref = typeof searchParams.ref === "string" ? `?ref=${encodeURIComponent(searchParams.ref.slice(0, 40))}` : "";
  redirect(`/reportes/${data.id}${ref}`);
}
