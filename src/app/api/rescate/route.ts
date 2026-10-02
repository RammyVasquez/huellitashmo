import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { avisarAdmin, sitioUrl } from "@/lib/server/notify";
import { coordenadas, ErrorUsuario, ESPECIES, ipDe, opcion, subirFotos, texto, verificarCaptcha } from "@/lib/server/intake";
import { normalizeWa } from "@/lib/util";
import { CATEGORIAS, type WelfareCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORIAS_VALIDAS = Object.keys(CATEGORIAS) as WelfareCategory[];

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    if (String(fd.get("website") ?? "")) return NextResponse.json({ ok: true });
    await verificarCaptcha(String(fd.get("token") ?? ""), ipDe(req));

    const category = opcion(fd, "category", CATEGORIAS_VALIDAS);
    const species = opcion(fd, "species", ESPECIES);
    const urgent = fd.get("urgent") === "1";
    const description = texto(fd, "description", 10, 2000, "la descripción");
    const zone = texto(fd, "zone", 2, 160, "la ubicación");
    const { lat, lng } = coordenadas(fd);

    const rawWa = String(fd.get("whatsapp") ?? "").trim();
    const wa = rawWa ? normalizeWa(rawWa) : null;
    if (rawWa && (!wa || wa.length < 12 || wa.length > 15)) throw new ErrorUsuario("Tu WhatsApp debe tener 10 dígitos.");
    const allow = CATEGORIAS[category].publica && !!wa && fd.get("allow") === "1";

    const photos = await subirFotos(fd);

    const { error } = await supabaseAdmin().from("welfare_reports").insert({
      category, species, urgent, description, zone, lat, lng, photos,
      contact_whatsapp: wa, allow_contact: allow, status: "pendiente",
    });
    if (error) throw error;

    await avisarAdmin(
      `${urgent ? "🚨 URGENTE · " : ""}Nuevo reporte de rescate`,
      [`Tipo: ${CATEGORIAS[category].titulo}`, `Especie: ${species}`, `Zona: ${zone}`, CATEGORIAS[category].publica ? "Se publicaría tras validarlo." : "Privado: no se publica."],
      `${sitioUrl()}/admin`
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorUsuario) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("api/rescate", e);
    return NextResponse.json({ error: "No pudimos guardar tu reporte. Si es urgente, busca ayuda directa. Intenta de nuevo en unos minutos." }, { status: 500 });
  }
}
