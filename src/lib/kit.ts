import type { Animal } from "@/lib/types";

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
  if (a.sterilized) out.push(`Esterilizad${fin(a)}`);
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
  const rasgos = [
    a.size && TAMANO[a.size],
    a.energy && ENERGIA[a.energy],
    a.good_kids === "si" && "se lleva bien con niños",
    a.good_pets === "si" && "se lleva bien con otros animales",
    a.sterilized && `esterilizad${fin(a)}`,
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
