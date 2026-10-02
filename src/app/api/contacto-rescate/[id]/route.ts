import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Solo si quien reportó aceptó ser contactado y el caso es público y está activo.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data } = await supabaseAdmin()
    .from("welfare_reports")
    .select("contact_whatsapp, allow_contact, category, status")
    .eq("id", params.id)
    .single();

  if (
    !data || !data.allow_contact || !data.contact_whatsapp ||
    data.status !== "activo" || !["atropellado_herido", "enfermo"].includes(data.category)
  ) return NextResponse.json({ error: "Contacto no disponible" }, { status: 404 });

  const msg = "Hola, vi tu reporte de un animal que necesita ayuda en Huellitas HMO y quiero ayudar.";
  return NextResponse.redirect(`https://wa.me/${data.contact_whatsapp}?text=${encodeURIComponent(msg)}`);
}
