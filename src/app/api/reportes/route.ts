import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { avisarAdmin, sitioUrl } from "@/lib/server/notify";
import { coordenadas, ErrorUsuario, ESPECIES, ipDe, opcion, subirFotos, texto, verificarCaptcha } from "@/lib/server/intake";
import { normalizeWa } from "@/lib/util";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    if (String(fd.get("website") ?? "")) return NextResponse.json({ ok: true }); // trampa para bots
    await verificarCaptcha(String(fd.get("token") ?? ""), ipDe(req));

    const kind = opcion(fd, "kind", ["perdido", "encontrado"] as const);
    const species = opcion(fd, "species", ESPECIES);
    const description = texto(fd, "description", 5, 1500, "la descripción");
    const zone = texto(fd, "zone", 2, 160, "la zona");
    const wa = normalizeWa(String(fd.get("whatsapp") ?? ""));
    if (!wa || wa.length < 12 || wa.length > 15) throw new ErrorUsuario("Escribe tu WhatsApp con 10 dígitos.");
    const { lat, lng } = coordenadas(fd);
    const photos = await subirFotos(fd);

    const { error } = await supabaseAdmin().from("reports").insert({
      kind, species, description, zone, lat, lng,
      contact_whatsapp: wa, photo_url: photos[0] ?? null, photos, status: "pendiente",
    });
    if (error) throw error;

    await avisarAdmin(
      `Nuevo reporte: mascota ${kind}`,
      [`Especie: ${species}`, `Zona: ${zone}`, "Está pendiente de revisión."],
      `${sitioUrl()}/admin`
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorUsuario) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("api/reportes", e);
    return NextResponse.json({ error: "No pudimos guardar tu reporte. Intenta de nuevo en unos minutos." }, { status: 500 });
  }
}
