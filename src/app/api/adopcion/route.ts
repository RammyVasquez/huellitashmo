import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { avisarAdmin, avisarError, avisarRefugio, sitioUrl } from "@/lib/server/notify";
import { ErrorUsuario, ipDe, opcion, texto, verificarCaptcha } from "@/lib/server/intake";
import { normalizeWa } from "@/lib/util";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const opcional = (fd: FormData, campo: string, max: number) => {
  const v = String(fd.get(campo) ?? "").trim();
  if (v.length > max) throw new ErrorUsuario("Uno de los textos es demasiado largo.");
  return v || null;
};

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    if (String(fd.get("website") ?? "")) return NextResponse.json({ ok: true });
    await verificarCaptcha(String(fd.get("token") ?? ""), ipDe(req));

    const animalId = String(fd.get("animal_id") ?? "");
    if (!UUID.test(animalId)) throw new ErrorUsuario("Datos del formulario no válidos.");
    if (fd.get("consent") !== "1" || fd.get("agrees_visit") !== "1" || fd.get("agrees_commitment") !== "1")
      throw new ErrorUsuario("Debes aceptar la entrevista, el compromiso de cuidado y el aviso de privacidad.");

    const applicant_name = texto(fd, "name", 3, 120, "tu nombre");
    const wa = normalizeWa(String(fd.get("whatsapp") ?? ""));
    if (!wa || wa.length < 12 || wa.length > 15) throw new ErrorUsuario("Escribe tu WhatsApp con 10 dígitos.");
    const colonia = texto(fd, "colonia", 2, 120, "tu colonia");
    const housing = opcion(fd, "housing", ["casa_patio", "casa_sin_patio", "departamento", "otro"] as const);
    const tenure = opcion(fd, "tenure", ["propia", "renta"] as const);
    const landlord = String(fd.get("landlord_ok") ?? "");
    const landlord_ok = tenure === "renta" ? (landlord === "si" ? true : landlord === "no" ? false : null) : null;
    const household_size = Number(fd.get("household_size"));
    if (!Number.isInteger(household_size) || household_size < 1 || household_size > 30) throw new ErrorUsuario("Revisa cuántas personas viven en tu casa.");
    const has_kids = fd.get("has_kids") === "1";
    const has_pets = fd.get("has_pets") === "1";
    const motivation = texto(fd, "motivation", 20, 1500, "por qué quieres adoptar");

    const db = supabaseAdmin();
    const { data: animal } = await db.from("animals").select("id, name, status, shelter_id").eq("id", animalId).single();
    if (!animal || animal.status === "adoptado") throw new ErrorUsuario("Este animal ya no está disponible para adopción.");

    // Evita duplicados: misma persona y mismo animal en los últimos 7 días
    const hace7 = new Date(Date.now() - 7 * 864e5).toISOString();
    const { count } = await db.from("adoption_requests").select("id", { count: "exact", head: true })
      .eq("animal_id", animalId).eq("whatsapp", wa).gte("created_at", hace7);
    if ((count ?? 0) > 0) throw new ErrorUsuario("Ya recibimos tu solicitud para este animal. El refugio te contactará.");

    const { error } = await db.from("adoption_requests").insert({
      animal_id: animalId, applicant_name, whatsapp: wa, colonia, housing, tenure, landlord_ok, household_size,
      has_kids, has_pets, pets_note: opcional(fd, "pets_note", 300), experience: opcional(fd, "experience", 800),
      away_plan: opcional(fd, "away_plan", 500), motivation, agrees_visit: true, agrees_commitment: true,
    });
    if (error) throw error;

    let refugio = "";
    if (animal.shelter_id) {
      const { data: sh } = await db.from("shelters").select("name").eq("id", animal.shelter_id).single();
      refugio = sh?.name ?? "";
    }
    await avisarAdmin("Nueva solicitud de adopción", [`Animal: ${animal.name}`, refugio ? `Refugio: ${refugio}` : ""].filter(Boolean), `${sitioUrl()}/admin`);
    await avisarRefugio(
      animal.shelter_id,
      `Nueva solicitud de adopción para ${animal.name}`,
      [
        "Hola,",
        "",
        `Recibiste una nueva solicitud de adopción para ${animal.name} en Huellitas HMO.`,
        "",
        `Entra a tu panel para ver las respuestas y decidir: ${sitioUrl()}/admin`,
        "",
        "Los datos de las personas que solicitan no se publican: solo los ven tú y el equipo de Huellitas HMO.",
        "Si ya no quieres recibir estos avisos, quita tu correo en “Mi refugio” del panel.",
      ].join("\n")
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorUsuario) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("api/adopcion", e);
    await avisarError("/api/adopcion");
    return NextResponse.json({ error: "No pudimos guardar tu solicitud. Intenta de nuevo en unos minutos." }, { status: 500 });
  }
}
