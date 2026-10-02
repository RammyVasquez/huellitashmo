import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { avisarAdmin, sitioUrl } from "@/lib/server/notify";

export const dynamic = "force-dynamic";

// Solo administradores: manda un aviso de prueba para comprobar la configuración
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const cliente = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data } = await cliente.rpc("is_admin");
  if (data !== true) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const r = await avisarAdmin("Prueba de avisos de Huellitas HMO", ["Si lees esto, las notificaciones funcionan."], `${sitioUrl()}/admin`);
  return NextResponse.json(r);
}
