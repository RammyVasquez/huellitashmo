import { supabaseAdmin } from "@/lib/supabase";

// Errores que SÍ se le muestran a la persona (el resto se registra y se responde genérico)
export class ErrorUsuario extends Error {}

export const ESPECIES = ["perro", "gato", "otro"] as const;

export function ipDe(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
}

export async function verificarCaptcha(token: string, ip: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return; // desarrollo local sin llaves
    throw new ErrorUsuario("El formulario no está configurado correctamente. Avisa al administrador del sitio.");
  }
  if (!token) throw new ErrorUsuario("Completa la verificación de seguridad.");
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
  const data = (await res.json()) as { success?: boolean };
  if (!data.success) throw new ErrorUsuario("No pudimos verificar que seas una persona. Intenta de nuevo.");
}

export function texto(fd: FormData, campo: string, min: number, max: number, nombre: string) {
  const v = String(fd.get(campo) ?? "").trim();
  if (v.length < min) throw new ErrorUsuario(`Completa ${nombre}: es muy corto o está en blanco.`);
  if (v.length > max) throw new ErrorUsuario(`Acorta ${nombre}: es demasiado largo.`);
  return v;
}

export function opcion<T extends string>(fd: FormData, campo: string, validas: readonly T[]): T {
  const v = String(fd.get(campo) ?? "");
  if (!(validas as readonly string[]).includes(v)) throw new ErrorUsuario("Datos del formulario no válidos.");
  return v as T;
}

export function coordenadas(fd: FormData) {
  const a = fd.get("lat"), b = fd.get("lng");
  if (a === null || b === null || a === "" || b === "") return { lat: null, lng: null };
  const lat = Number(a), lng = Number(b);
  // Rango amplio alrededor de Sonora: descarta valores absurdos
  if (!(lat > 26 && lat < 33 && lng > -115.5 && lng < -108)) throw new ErrorUsuario("La ubicación marcada no es válida.");
  return { lat, lng };
}

const esJpeg = (b: Buffer) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const esPng = (b: Buffer) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;

// Sube las fotos con la llave de servidor, validando tipo real, peso y cantidad
export async function subirFotos(fd: FormData): Promise<string[]> {
  const files = fd.getAll("fotos").filter((f): f is File => typeof f !== "string" && f.size > 0);
  if (files.length > 5) throw new ErrorUsuario("Máximo 5 fotos.");
  const db = supabaseAdmin();
  const urls: string[] = [];
  for (const f of files) {
    if (f.size > 1_500_000) throw new ErrorUsuario("Una de las fotos pesa demasiado. Intenta con otra.");
    const buf = Buffer.from(await f.arrayBuffer());
    const jpeg = esJpeg(buf);
    if (!jpeg && !esPng(buf)) throw new ErrorUsuario("Solo se aceptan fotos JPG o PNG.");
    const path = `reportes/${crypto.randomUUID()}.${jpeg ? "jpg" : "png"}`;
    const { error } = await db.storage.from("fotos").upload(path, buf, { contentType: jpeg ? "image/jpeg" : "image/png" });
    if (error) throw error;
    urls.push(db.storage.from("fotos").getPublicUrl(path).data.publicUrl);
  }
  return urls;
}
