import { enComun, normalizar } from "@/lib/buscar";
import { km, type Pos } from "@/lib/geo";

export type Reportable = { lat: number | null; lng: number | null; zone: string | null; description: string; created_at: string };
export type Candidato = { score: number; km: number | null; rasgos: string[] };

const palabrasZona = (z: string | null) => new Set(normalizar(z ?? "").split(/[^a-z0-9]+/).filter((w) => w.length > 3));

// Qué tan probable es que dos reportes (uno perdido y otro encontrado, misma especie) sean el mismo animal.
// Usa distancia, zona escrita y rasgos en común (color, collar, tamaño...). Devuelve null si no vale la pena avisar.
export function puntuar(base: Reportable, otro: Reportable, ahora = Date.now()): Candidato | null {
  let score = 0;
  let distancia: number | null = null;
  if (base.lat != null && base.lng != null && otro.lat != null && otro.lng != null) {
    distancia = km({ lat: base.lat, lng: base.lng } as Pos, { lat: otro.lat, lng: otro.lng } as Pos);
    if (distancia > 15) return null;
    score += distancia <= 1 ? 3 : distancia <= 3 ? 2 : distancia <= 8 ? 1 : 0;
  } else {
    const a = palabrasZona(base.zone), b = palabrasZona(otro.zone);
    if ([...a].some((w) => b.has(w))) score += 1.5;
  }
  const rasgos = enComun(base.description, otro.description);
  score += Math.min(3, rasgos.length);
  if (ahora - Date.parse(otro.created_at) < 14 * 86400000) score += 0.5;
  const hayCercania = distancia !== null ? distancia <= 8 : score >= 1.5;
  if (score < 2.5 || (!hayCercania && rasgos.length < 2)) return null;
  return { score, km: distancia, rasgos };
}
