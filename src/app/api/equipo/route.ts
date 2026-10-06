import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ErrorUsuario } from "@/lib/server/intake";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "moderador", "refugio"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // sin caracteres que se confunden
const contrasenaTemporal = () => Array.from({ length: 12 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");

// Devuelve el id de quien hace la petición solo si es administrador
async function adminDe(req: Request): Promise<string | null> {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const db = supabaseAdmin();
  const { data } = await db.auth.getUser(token);
  const id = data.user?.id;
  if (!id) return null;
  const { data: a } = await db.from("admins").select("user_id").eq("user_id", id).maybeSingle();
  return a ? id : null;
}

type Cuerpo = { accion?: string; email?: string; rol?: string; shelter_id?: string; nombre?: string; user_id?: string };

export async function POST(req: Request) {
  try {
    const quien = await adminDe(req);
    if (!quien) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const b = (await req.json()) as Cuerpo;
    const db = supabaseAdmin();

    if (b.accion === "crear") {
      const email = String(b.email ?? "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new ErrorUsuario("Escribe un correo válido.");
      const rol = (ROLES as readonly string[]).includes(String(b.rol)) ? (b.rol as (typeof ROLES)[number]) : null;
      if (!rol) throw new ErrorUsuario("Elige un tipo de acceso.");
      const nombre = String(b.nombre ?? "").trim().slice(0, 80);

      let shelter_id: string | null = null;
      if (rol === "refugio") {
        const { data: sh } = await db.from("shelters").select("id").eq("id", String(b.shelter_id ?? "")).maybeSingle();
        if (!sh) throw new ErrorUsuario("Elige el refugio al que pertenece esta persona.");
        shelter_id = sh.id;
      }

      const password = contrasenaTemporal();
      const { data: creado, error } = await db.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { must_change_password: true, nombre },
      });
      if (error || !creado.user) {
        throw new ErrorUsuario(/registered|exists/i.test(error?.message ?? "") ? "Ese correo ya tiene una cuenta." : "No se pudo crear la cuenta. Revisa el correo e intenta de nuevo.");
      }
      const uid = creado.user.id;
      const { error: e2 } = await db.from("staff").insert({ user_id: uid, role: rol, shelter_id, email, display_name: nombre || null });
      const e3 = !e2 && rol === "admin" ? (await db.from("admins").insert({ user_id: uid })).error : null;
      if (e2 || e3) {
        await db.auth.admin.deleteUser(uid); // no dejar una cuenta a medias
        throw e2 ?? e3;
      }
      return NextResponse.json({ ok: true, email, password });
    }

    if (b.accion === "reiniciar") {
      const uid = String(b.user_id ?? "");
      if (!UUID.test(uid)) throw new ErrorUsuario("Datos no válidos.");
      const { data: u } = await db.auth.admin.getUserById(uid);
      if (!u.user) throw new ErrorUsuario("No encontramos esa cuenta.");
      const password = contrasenaTemporal();
      const { error } = await db.auth.admin.updateUserById(uid, {
        password, user_metadata: { ...(u.user.user_metadata ?? {}), must_change_password: true },
      });
      if (error) throw error;
      return NextResponse.json({ ok: true, email: u.user.email, password });
    }

    if (b.accion === "quitar") {
      const uid = String(b.user_id ?? "");
      if (!UUID.test(uid)) throw new ErrorUsuario("Datos no válidos.");
      if (uid === quien) throw new ErrorUsuario("No puedes quitar tu propio acceso.");
      const { data: a } = await db.from("admins").select("user_id").eq("user_id", uid).maybeSingle();
      if (a) {
        const { count } = await db.from("admins").select("user_id", { count: "exact", head: true });
        if ((count ?? 0) <= 1) throw new ErrorUsuario("No puedes quitar al último administrador.");
      }
      const { error } = await db.auth.admin.deleteUser(uid);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    throw new ErrorUsuario("Acción no válida.");
  } catch (e) {
    if (e instanceof ErrorUsuario) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("api/equipo", e instanceof Error ? e.message : "error");
    return NextResponse.json({ error: "No se pudo completar la acción." }, { status: 500 });
  }
}
