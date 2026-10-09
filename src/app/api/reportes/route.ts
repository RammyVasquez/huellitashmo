import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { avisarAdmin, avisarError, sitioUrl } from "@/lib/server/notify";
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
    const zone = texto(fd, "zone", 2, 160, "la zona");
    const wa = normalizeWa(String(fd.get("whatsapp") ?? ""));
    if (wa && (wa.length < 12 || wa.length > 15)) throw new ErrorUsuario("Revisa tu WhatsApp: debe tener 10 dígitos. Si prefieres, déjalo vacío.");
    const { lat, lng } = coordenadas(fd);
    const photos = await subirFotos(fd);

    const descripcion = String(fd.get("description") ?? "").trim().slice(0, 1000);
    if (descripcion.length > 0 && descripcion.length < 5) throw new ErrorUsuario("La descripción es muy corta. Cuéntanos un poco más o déjala en blanco y agrega una foto.");
    if (!descripcion && photos.length === 0) throw new ErrorUsuario("Agrega una foto o escribe una descripción del animal.");
    const senas = String(fd.get("marks") ?? "").trim().slice(0, 400);
    const base = descripcion || `${species === "perro" ? "Perro" : species === "gato" ? "Gato" : "Animal"} ${kind}. Mira las fotos.`;
    const description = senas ? `${base}\n\nSeñas particulares: ${senas}` : base;
    const detalle = kind === "encontrado" ? String(fd.get("private_detail") ?? "").trim().slice(0, 300) : "";

    const { error } = await supabaseAdmin().from("reports").insert({
      kind, species, description, zone, lat, lng,
      contact_whatsapp: wa || null, photo_url: photos[0] ?? null, photos, status: "pendiente", private_detail: detalle || null,
    });
    if (error) throw error;

    await avisarAdmin(
      `Nuevo reporte: mascota ${kind}`,
      [`Especie: ${species}`, `Zona: ${zone}`, wa ? "Dejó WhatsApp de contacto." : "No dejó contacto.", "Está pendiente de revisión."],
      `${sitioUrl()}/admin`
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorUsuario) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("api/reportes", e);
    await avisarError("/api/reportes");
    return NextResponse.json({ error: "No pudimos guardar tu reporte. Intenta de nuevo en unos minutos." }, { status: 500 });
  }
}
