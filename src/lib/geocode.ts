// Búsqueda de direcciones de Hermosillo con servicios gratuitos de OpenStreetMap:
//  - Overpass: encuentra cruces exactos de dos calles ("Blvd. Kino y Reforma")
//  - Nominatim: direcciones, colonias y lugares (varias variantes de escritura)
export type Lugar = { label: string; lat: number; lng: number };
export type Resultado = { lugares: Lugar[]; esquina: boolean; error: boolean };

// Zona de Hermosillo: se usa para limitar resultados
const CAJA = { sur: 28.9, oeste: -111.2, norte: 29.3, este: -110.75 };
const dentro = (lat: number, lng: number) => lat > CAJA.sur && lat < CAJA.norte && lng > CAJA.oeste && lng < CAJA.este;
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pedir(url: string, init?: RequestInit, ms = 12000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctl.signal }); } finally { clearTimeout(t); }
}

// ---------- Texto ----------
const TIPOS_VIA = "calle|avenida|av|bulevar|boulevard|blvd|calzada|privada|cerrada|paseo|prolongación|prolongacion|camino|andador|periférico|periferico";

export function etiqueta(display: string) {
  const partes = display.split(", ");
  const i = partes.indexOf("Hermosillo");
  return partes.slice(0, i > 0 ? Math.min(i, 3) : 3).join(", ");
}

export function expandir(texto: string) {
  return texto.trim().replace(/\s+/g, " ")
    .replace(/\bblvd\b\.?/gi, "bulevar").replace(/\bav\b\.?/gi, "avenida").replace(/\bcol\b\.?/gi, "colonia")
    .replace(/\bfracc\b\.?/gi, "fraccionamiento").replace(/\bcalz\b\.?/gi, "calzada").replace(/\bprol\b\.?/gi, "prolongación");
}

export function variantes(texto: string): string[] {
  const exp = expandir(texto);
  const set = new Set<string>();
  const add = (s: string) => s.trim() && set.add(`${s.trim()}, Hermosillo, Sonora`);
  add(exp);
  add(exp.replace(/\bbulevar\b/gi, "boulevard"));
  add(exp.replace(new RegExp(`^(${TIPOS_VIA}|colonia|fraccionamiento)\\s+`, "i"), ""));
  return [...set].slice(0, 3);
}

// "Blvd. Kino y Reforma", "Reforma esquina con Kino", "Reforma con Kino" -> [calle A, calle B]
export function separarEsquina(texto: string): [string, string] | null {
  const partes = expandir(texto).split(/\s+(?:y|e|esquina con|esquina|esq\.? con|esq\.?|con|cruce con|cruce)\s+/i).map((p) => p.trim());
  if (partes.length !== 2 || partes.some((p) => p.length < 2)) return null;
  return [partes[0], partes[1]];
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function nucleo(calle: string) {
  const limpio = sinAcentos(calle).toLowerCase().replace(/[^a-z0-9ñ\s]/gi, " ").replace(/\s+/g, " ").trim();
  return limpio.replace(new RegExp(`^(${TIPOS_VIA})\\s+`, "i"), "").trim();
}

// Expresión para Overpass que tolera acentos, ñ y palabras intermedias
export function patronCalle(calle: string) {
  const mapa: Record<string, string> = { a: "[aáà]", e: "[eé]", i: "[ií]", o: "[oó]", u: "[uúü]", n: "[nñ]" };
  return nucleo(calle).split(/\s+/).filter(Boolean).map((w) => [...w].map((c) => mapa[c] ?? c).join("")).join(".*");
}

// ---------- Servicios ----------
const NOMINATIM = "https://nominatim.openstreetmap.org";

async function nominatim(q: string): Promise<Lugar[]> {
  const params = new URLSearchParams({
    q, format: "jsonv2", limit: "5", dedupe: "1", "accept-language": "es",
    viewbox: `${CAJA.oeste},${CAJA.norte},${CAJA.este},${CAJA.sur}`, bounded: "1",
  });
  const res = await pedir(`${NOMINATIM}/search?${params}`);
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  const vistos = new Set<string>();
  return data
    .map((d) => ({ label: etiqueta(d.display_name), lat: parseFloat(d.lat), lng: parseFloat(d.lon) }))
    .filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng) && dentro(l.lat, l.lng))
    .filter((l) => (vistos.has(l.label) ? false : (vistos.add(l.label), true)));
}

async function cruce(a: string, b: string): Promise<Lugar | null> {
  const pa = patronCalle(a), pb = patronCalle(b);
  if (!pa || !pb) return null;
  const caja = `${CAJA.sur},${CAJA.oeste},${CAJA.norte},${CAJA.este}`;
  const consulta = `[out:json][timeout:20];way["highway"]["name"~"${pa}",i](${caja})->.a;way["highway"]["name"~"${pb}",i](${caja})->.b;node(w.a)(w.b);out 10;`;
  const res = await pedir("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(consulta)}`,
  }, 20000);
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = (await res.json()) as { elements?: { lat: number; lon: number }[] };
  const nodos = (data.elements ?? []).filter((n) => typeof n.lat === "number" && typeof n.lon === "number");
  if (!nodos.length) return null;
  // Si hay varios nodos del mismo cruce (bulevares con camellón) se promedian; si están lejos, se toma el primero
  const cerca = nodos.filter((n) => Math.abs(n.lat - nodos[0].lat) < 0.0035 && Math.abs(n.lon - nodos[0].lon) < 0.0035);
  const lat = cerca.reduce((s, n) => s + n.lat, 0) / cerca.length;
  const lng = cerca.reduce((s, n) => s + n.lon, 0) / cerca.length;
  return { label: `Cruce de ${a} y ${b}`, lat, lng };
}

export async function buscarLugar(texto: string): Promise<Resultado> {
  let huboRespuesta = false;

  const par = separarEsquina(texto);
  if (par) {
    try {
      huboRespuesta = true;
      const c = await cruce(par[0], par[1]);
      if (c) return { lugares: [c], esquina: true, error: false };
    } catch { huboRespuesta = false; }
  }

  const consultas = variantes(texto);
  if (par) consultas.push(`${expandir(par[0])}, Hermosillo, Sonora`); // último recurso: la primera calle
  for (let i = 0; i < consultas.length; i++) {
    try {
      if (i > 0) await espera(1100); // Nominatim pide máximo 1 consulta por segundo
      const lugares = await nominatim(consultas[i]);
      huboRespuesta = true;
      if (lugares.length) return { lugares, esquina: false, error: false };
    } catch { /* se intenta la siguiente variante */ }
  }
  return { lugares: [], esquina: false, error: !huboRespuesta };
}

export async function reverso(p: { lat: number; lng: number }): Promise<string | null> {
  try {
    const params = new URLSearchParams({ lat: String(p.lat), lon: String(p.lng), format: "jsonv2", zoom: "18", addressdetails: "1", "accept-language": "es" });
    const res = await pedir(`${NOMINATIM}/reverse?${params}`);
    if (!res.ok) return null;
    const d = (await res.json()) as { address?: Record<string, string>; display_name?: string };
    const a = d.address ?? {};
    const via = a.road ?? a.pedestrian ?? a.footway ?? a.residential;
    const colonia = a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district;
    const partes = [via, colonia].filter(Boolean) as string[];
    if (partes.length) return partes.join(", ");
    return d.display_name ? etiqueta(d.display_name) : null;
  } catch {
    return null;
  }
}
