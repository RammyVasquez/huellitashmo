import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Redirige a WhatsApp sin exponer el teléfono en el HTML ni en la API pública.
// TODO: limitar peticiones por IP para frenar el scraping de teléfonos.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data } = await supabaseAdmin()
    .from("reports")
    .select("contact_whatsapp, kind")
    .eq("id", params.id)
    .in("status", ["activo"])
    .single();

  if (!data) return NextResponse.json({ error: "Reporte no disponible" }, { status: 404 });

  const msg =
    data.kind === "perdido"
      ? "Hola, vi tu reporte de mascota perdida en Huellitas HMO."
      : "Hola, creo que la mascota que encontraste es la mía (Huellitas HMO).";
  return NextResponse.redirect(`https://wa.me/${data.contact_whatsapp}?text=${encodeURIComponent(msg)}`);
}
