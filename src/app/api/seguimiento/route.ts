import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { avisarAdmin, avisarError, avisarRefugio, sitioUrl } from "@/lib/server/notify";
import { ErrorUsuario, ipDe, opcion, subirFotos, verificarCaptcha } from "@/lib/server/intake";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    if (String(fd.get("website") ?? "")) return NextResponse.json({ ok: true });
    await verificarCaptcha(String(fd.get("captcha") ?? ""), ipDe(req));

    const token = String(fd.get("token") ?? "");
    if (!/^[0-9a-f]{64}$/.test(token)) throw new ErrorUsuario("Esta liga no es válida.");
    const adapted = opcion(fd, "adapted", ["muy_bien", "bien", "con_dificultades"] as const);
    const notes = String(fd.get("notes") ?? "").trim();
    if (notes.length > 2000) throw new ErrorUsuario("El comentario es demasiado largo.");

    const db = supabaseAdmin();
    const { data: fila } = await db.from("adoption_followups")
      .select("id, status, stage, adoption_requests(animals(name, shelter_id))").eq("token", token).single();
    type Fila = { id: string; status: string; stage: number; adoption_requests: { animals: { name: string; shelter_id: string | null } | null } | null };
    const f = fila as unknown as Fila | null;
    if (!f) throw new ErrorUsuario("Esta liga no es válida.");
    if (f.status === "respondido") throw new ErrorUsuario("Ya recibimos tu respuesta. ¡Gracias!");
    if (f.status === "omitido") throw new ErrorUsuario("Este seguimiento ya no está activo.");

    const photos = await subirFotos(fd, "seguimiento", 3);
    const { error } = await db.from("adoption_followups").update({
      status: "respondido", answered_at: new Date().toISOString(), adapted, notes: notes || null,
      photos, photo_consent: photos.length > 0 && fd.get("photo_consent") === "1",
    }).eq("id", f.id);
    if (error) throw error;

    await avisarAdmin("Respondieron un seguimiento de adopción", [`Seguimiento de ${f.stage} ${f.stage === 1 ? "mes" : "meses"}`], `${sitioUrl()}/admin`);
    const animal = f.adoption_requests?.animals;
    await avisarRefugio(
      animal?.shelter_id ?? null,
      `Respondieron el seguimiento de ${animal?.name ?? "una adopción"}`,
      `Hola,\n\nLa familia de ${animal?.name ?? "uno de tus animales"} respondió el seguimiento de ${f.stage} ${f.stage === 1 ? "mes" : "meses"}.\n\nEntra a tu panel para verlo: ${sitioUrl()}/admin\n`
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorUsuario) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("api/seguimiento", e);
    await avisarError("/api/seguimiento");
    return NextResponse.json({ error: "No pudimos guardar tu respuesta. Intenta de nuevo en unos minutos." }, { status: 500 });
  }
}
