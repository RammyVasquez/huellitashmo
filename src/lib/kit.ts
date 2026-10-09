import type { Animal } from "@/lib/types";
import { esteril } from "@/lib/animales";

const TAMANO = { pequeno: "pequeño", mediano: "mediano", grande: "grande" } as const;
const ENERGIA = { tranquilo: "tranquilo", moderado: "energía moderada", activo: "muy activo" } as const;

const fin = (a: Animal) => (a.sex === "hembra" ? "a" : a.sex === "macho" ? "o" : "o/a");

function corte(t: string | null, n: number) {
  if (!t) return "";
  const limpio = t.replace(/\s+/g, " ").trim();
  if (limpio.length <= n) return limpio;
  return `${limpio.slice(0, n).replace(/\s+\S*$/, "")}…`;
}

// Etiquetas cortas para la imagen
export function etiquetasKit(a: Animal): string[] {
  const out = [a.species === "perro" ? "Perro" : a.species === "gato" ? "Gato" : "Animal"];
  if (a.age_text) out.push(a.age_text);
  if (a.size) out.push(TAMANO[a.size]);
  if (a.sterilized) out.push(esteril(a.sex, true));
  return out.slice(0, 4);
}

// Texto listo para pegar en redes
export function textoKit(a: Animal, refugio: string | null, url: string): string {
  if (a.status === "adoptado") {
    return [
      `¡${a.name} ya encontró hogar! 💛`,
      refugio ? `Gracias a la familia que abrió su casa y a ${refugio} por el rescate.` : "Gracias a la familia que abrió su casa.",
      "",
      `Conoce a quienes aún esperan una familia: ${url}`,
      "#AdopciónHMO #Hermosillo #HuellitasHMO",
    ].join("\n");
  }
  const sexo = a.sex === "hembra" ? "Hembra" : a.sex === "macho" ? "Macho" : null;
  const especie = a.species === "perro" ? "Perro" : a.species === "gato" ? "Gato" : "Animal";
  if (a.status === "en_cuidados") {
    return [
      `💛 ${a.name} se está recuperando en Hermosillo`,
      [especie, a.age_text, sexo].filter(Boolean).join(" · "),
      "",
      `Todavía no se puede adoptar, pero ${a.sponsorable ? "puedes ayudarle apadrinándolo en especie" : "puedes seguir su historia"}.`,
      corte(a.description, 200),
      refugio ? `Lo cuida: ${refugio}` : "",
      "",
      `Conoce su historia y cómo ayudar: ${url}`,
      "#Apadrina #Hermosillo #HuellitasHMO",
    ].filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  const rasgos = [
    a.size && TAMANO[a.size],
    a.energy && ENERGIA[a.energy],
    a.good_kids === "si" && "se lleva bien con niños",
    a.good_pets === "si" && "se lleva bien con otros animales",
    a.sterilized && esteril(a.sex),
    a.vaccinated && `vacunad${fin(a)}`,
  ].filter(Boolean);
  return [
    `🐾 ${a.name} busca hogar en Hermosillo`,
    [especie, a.age_text, sexo].filter(Boolean).join(" · "),
    rasgos.length ? rasgos.join(", ") : "",
    "",
    corte(a.description, 220),
    refugio ? `Lo cuida: ${refugio}` : "",
    "",
    `Si quieres darle un hogar, llena su solicitud aquí: ${url}`,
    "#AdopciónHMO #Hermosillo #AdoptaNoCompres #HuellitasHMO",
  ].filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const nombreArchivo = (nombre: string) =>
  `huellitas-${nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "animal"}`;

// Frase de la imagen: concuerda con el sexo del animal ("Adóptala" / "Adóptalo")
export function ctaKit(a: Animal): string {
  if (a.status === "adoptado") return "Conoce a quienes aún esperan";
  if (a.status === "en_cuidados") return "Ayúdale a recuperarse";
  return a.sex === "hembra" ? "Adóptala" : a.sex === "macho" ? "Adóptalo" : "Dale un hogar";
}


// ---- Kit para reportes de mascotas perdidas o encontradas (no incluye ningún teléfono) ----
type ReporteKit = { kind: "perdido" | "encontrado"; species: string; description: string; zone: string | null; created_at: string };
const palabraEspecie = (e: string) => (e === "perro" ? "perro" : e === "gato" ? "gato" : "mascota");
const cortarPalabra = (t: string, n: number) => {
  const l = t.replace(/\s+/g, " ").trim();
  return l.length <= n ? l : `${l.slice(0, n).replace(/\s+\S*$/, "")}…`;
};

const CALLE = /^(c\.|calle|av\.?|avenida|blvd\.?|boulevard|calz\.?|calzada|prol\.?|prolongaci[oó]n|carretera|camino)(\s|$)/i;
const RUIDO = /^(son\.?|sonora|m[eé]xico|mx|hermosillo)$/i;

// Zona que sí se puede mostrar: en las encontradas, solo colonia o zona (sin calle ni números); en las perdidas, sin números de casa.
export function zonaPublica(zona: string | null, kind: "perdido" | "encontrado"): string {
  const z = (zona ?? "").trim();
  if (!z) return "Hermosillo";
  const segs = z.split(",").map((x) => x.trim()).filter(Boolean);
  const limpios = kind === "encontrado"
    ? segs.filter((x) => !/\d/.test(x) && !CALLE.test(x) && !RUIDO.test(x))
    : segs.map((x) => x.replace(/\s*#?\b\d{1,5}[a-zA-Z]?\b/g, "").trim()).filter((x) => x && !RUIDO.test(x));
  const r = limpios.join(", ") || z.replace(/\d+/g, "").replace(/\s+/g, " ").trim();
  return r || "Hermosillo";
}

export function tituloReporte(r: ReporteKit) {
  const e = palabraEspecie(r.species);
  const fem = e === "mascota";
  return `${e.charAt(0).toUpperCase()}${e.slice(1)} ${r.kind === "perdido" ? (fem ? "perdida" : "perdido") : fem ? "encontrada" : "encontrado"}`;
}

// La descripción guarda las señas al final ("Señas particulares: ..."): se separan para que se lean mejor
export function partesDescripcion(d: string): { descripcion: string; senas: string } {
  const m = d.split(/\n\s*\n?\s*Señas particulares:\s*/i);
  return { descripcion: m[0].replace(/\s+/g, " ").trim(), senas: (m[1] ?? "").replace(/\s+/g, " ").trim() };
}

export function textoKitReporte(r: ReporteKit, url: string, fecha: string): string {
  const e = palabraEspecie(r.species);
  const E = e.toUpperCase();
  const zona = zonaPublica(r.zone, r.kind);
  const { descripcion, senas } = partesDescripcion(r.description);
  const cuerpo = [cortarPalabra(descripcion, 240), senas ? `🔎 Señas: ${cortarPalabra(senas, 160)}` : ""].filter(Boolean);
  if (r.kind === "perdido")
    return [
      `🚨 ¡SE PERDIÓ ${E === "MASCOTA" ? "UNA MASCOTA" : `UN ${E}`}! ¿Lo has visto?`,
      `📍 ${zona}`,
      `📅 Desde el ${fecha}`,
      "",
      ...cuerpo,
      "",
      `Si tienes información, entra aquí 👉 ${url}`,
      "",
      "¡Compártelo, por favor! 🙏",
      "#MascotaPerdida #Hermosillo #HuellitasHMO",
    ].join("\n");
  return [
    `🐾 ¡SE ENCONTRÓ ${E === "MASCOTA" ? "UNA MASCOTA" : `UN ${E}`}! ¿Es tu ${e}?`,
    `📍 Zona aproximada: ${zona}`,
    `📅 Reportado el ${fecha}`,
    "",
    ...cuerpo,
    "",
    `Si es tuyo o conoces a su familia, confírmalo aquí 👉 ${url}`,
    "",
    "¡Compártelo para que regrese a casa! 🙏",
    "#MascotaEncontrada #Hermosillo #HuellitasHMO",
  ].join("\n");
}
