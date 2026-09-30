// WhatsApp: deja solo dígitos; si son 10 (número de México), agrega la lada de país 52.
export function normalizeWa(input: string): string | null {
  const d = input.replace(/\D/g, "");
  if (!d) return null;
  return d.length === 10 ? `52${d}` : d;
}

export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

export const errTexto = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "Error desconocido";

// Valida un enlace de red social: debe ser https y del dominio esperado. Vacío = null.
export function cleanSocial(input: string, hosts: string[]): string | null {
  const t = input.trim();
  if (!t) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
  } catch {
    throw new Error(`El enlace “${t}” no es válido.`);
  }
  const ok = hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  if (!ok) throw new Error(`El enlace debe ser de ${hosts[0]}.`);
  u.protocol = "https:";
  return u.toString();
}
