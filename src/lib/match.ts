import type { Animal } from "@/lib/types";

export type Answers = {
  species: "perro" | "gato" | "cualquiera";
  space: "patio" | "chico";
  activity: "tranquilo" | "moderado" | "activo";
  kids: boolean;
  pets: boolean;
  age: "cachorro" | "joven" | "adulto" | "senior" | "igual";
};

export type Result = {
  animal: Animal;
  score: number;
  tier: "Muy buena compatibilidad" | "Buena compatibilidad" | "Podría funcionar";
  reasons: string[];
  missing: string[];
};

const NIVELES = ["tranquilo", "moderado", "activo"] as const;
const EDADES = ["cachorro", "joven", "adulto", "senior"] as const;

// Guía basada en reglas simples y transparentes. "Sin dato" puntúa neutral y se avisa a la persona.
export function recomendar(animals: Animal[], ans: Answers) {
  const results: Result[] = [];
  let excluidos = 0;

  for (const a of animals) {
    if (ans.species !== "cualquiera" && a.species !== ans.species) continue;
    if ((ans.kids && a.good_kids === "no") || (ans.pets && a.good_pets === "no")) { excluidos++; continue; }

    let score = 0;
    const reasons: string[] = [];
    const missing: string[] = [];

    // Energía (30)
    if (a.energy) {
      const diff = Math.abs(NIVELES.indexOf(a.energy) - NIVELES.indexOf(ans.activity));
      score += diff === 0 ? 30 : diff === 1 ? 15 : 0;
      if (diff === 0) reasons.push(a.energy === "tranquilo" ? "Es tranquilo, como tu ritmo de vida" : a.energy === "moderado" ? "Tiene energía moderada, como tú" : "Es muy activo, ideal para tu estilo");
    } else { score += 15; missing.push("su nivel de energía"); }

    // Espacio y tamaño (20): solo importa en perros
    if (a.species !== "perro" || ans.space === "patio") {
      score += 20;
      if (a.species === "perro" && a.size === "grande") reasons.push("Tu espacio abierto le queda perfecto");
    } else if (a.size) {
      score += a.size === "pequeno" ? 20 : a.size === "mediano" ? 12 : 4;
      if (a.size === "pequeno") reasons.push("Su tamaño va bien con un espacio chico");
    } else { score += 10; missing.push("su tamaño"); }

    // Niños (20)
    if (!ans.kids) score += 20;
    else if (a.good_kids === "si") { score += 20; reasons.push("Se lleva bien con niños"); }
    else { score += 8; missing.push("si convive con niños"); }

    // Otros animales (15)
    if (!ans.pets) score += 15;
    else if (a.good_pets === "si") { score += 15; reasons.push("Se lleva bien con otros animales"); }
    else { score += 6; missing.push("si convive con otros animales"); }

    // Edad (15)
    if (ans.age === "igual") score += 15;
    else if (a.age_group) {
      const diff = Math.abs(EDADES.indexOf(a.age_group) - EDADES.indexOf(ans.age));
      score += diff === 0 ? 15 : diff === 1 ? 8 : 0;
      if (diff === 0) reasons.push("Tiene la edad que buscas");
    } else { score += 7; missing.push("su grupo de edad"); }

    results.push({
      animal: a,
      score,
      tier: score >= 75 ? "Muy buena compatibilidad" : score >= 55 ? "Buena compatibilidad" : "Podría funcionar",
      reasons,
      missing,
    });
  }

  results.sort((x, y) => y.score - x.score); // estable: a igual puntaje, el más reciente primero
  return { results: results.slice(0, 8), excluidos };
}
