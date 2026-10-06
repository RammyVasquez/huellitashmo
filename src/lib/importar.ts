// Importación de animales desde una hoja de Excel o CSV. Todo corre en el navegador de quien importa.
export type Campo =
  | "nombre" | "especie" | "sexo" | "edad" | "grupo_edad" | "tamano" | "energia"
  | "ninos" | "otros" | "esterilizado" | "vacunado" | "apadrinable" | "historia";

export type FilaImport = {
  fila: number;                       // número de fila en la hoja (la 1 son los encabezados)
  nombre: string;
  species: "perro" | "gato" | "otro" | null;
  sex: "macho" | "hembra" | null;
  age_text: string | null;
  age_group: "cachorro" | "joven" | "adulto" | "senior" | null;
  size: "pequeno" | "mediano" | "grande" | null;
  energy: "tranquilo" | "moderado" | "activo" | null;
  good_kids: "si" | "no" | null;
  good_pets: "si" | "no" | null;
  sterilized: boolean;
  vaccinated: boolean;
  sponsorable: boolean;
  description: string | null;
  errores: string[];                  // impiden importar la fila
  avisos: string[];                   // se importa, pero conviene revisar
  duplicado: string | null;           // motivo si ya existe y se omitirá
};

export const MAX_FILAS = 300;

const quitar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const compacto = (s: string) => quitar(s).replace(/[^a-z0-9]/g, "");

const SINONIMOS: Record<Campo, string[]> = {
  nombre: ["nombre", "name", "nombre del animal"],
  especie: ["especie", "tipo", "animal"],
  sexo: ["sexo", "genero"],
  edad: ["edad"],
  grupo_edad: ["grupo_edad", "grupo de edad", "etapa"],
  tamano: ["tamano", "talla", "size"],
  energia: ["energia", "nivel de energia"],
  ninos: ["ninos", "se lleva bien con ninos", "con ninos"],
  otros: ["otros_animales", "otros animales", "otras mascotas", "con otros animales"],
  esterilizado: ["esterilizado", "esterilizada", "castrado", "castrada"],
  vacunado: ["vacunado", "vacunada", "vacunas"],
  apadrinable: ["apadrinable", "apadrinar"],
  historia: ["historia", "descripcion", "caracter", "notas"],
};
const MAPA = new Map<string, Campo>();
(Object.keys(SINONIMOS) as Campo[]).forEach((c) => SINONIMOS[c].forEach((s) => MAPA.set(compacto(s), c)));

export const PLANTILLA_CSV =
  "\uFEFF" +
  [
    "nombre,especie,sexo,edad,grupo_edad,tamano,energia,ninos,otros_animales,esterilizado,vacunado,apadrinable,historia",
    'EJEMPLO Canela,perro,hembra,2 años,joven,mediano,tranquilo,si,si,si,si,no,"Tranquila y cariñosa. Borra esta fila de ejemplo."',
    'EJEMPLO Michi,gato,macho,6 meses,cachorro,pequeño,activo,si,no,no,si,no,"Juguetón, rescatado de la calle. Borra esta fila de ejemplo."',
  ].join("\n");

type Par<T> = [T, string | null];

const siNo = (v: string): Par<boolean | null> => {
  const s = quitar(v);
  if (!s) return [null, null];
  if (["si", "s", "x", "1", "true", "yes", "y", "verdadero"].includes(s)) return [true, null];
  if (["no", "n", "0", "false", "falso"].includes(s)) return [false, null];
  return [null, `“${v.trim()}” no es sí/no`];
};

function elegir<T extends string>(v: string, tabla: Record<string, T>, nombre: string): Par<T | null> {
  const s = quitar(v);
  if (!s) return [null, null];
  if (tabla[s]) return [tabla[s], null];
  return [null, `${nombre} “${v.trim()}” no se reconoce y quedó vacío`];
}

const ESPECIES: Record<string, "perro" | "gato"> = { perro: "perro", perra: "perro", perrito: "perro", perrita: "perro", gato: "gato", gata: "gato", gatito: "gato", gatita: "gato" };
const SEXOS: Record<string, "macho" | "hembra"> = { macho: "macho", m: "macho", masculino: "macho", hembra: "hembra", h: "hembra", f: "hembra", femenino: "hembra" };
const GRUPOS: Record<string, "cachorro" | "joven" | "adulto" | "senior"> = { cachorro: "cachorro", cachorra: "cachorro", bebe: "cachorro", joven: "joven", adulto: "adulto", adulta: "adulto", senior: "senior", viejo: "senior", vieja: "senior", mayor: "senior" };
const TAMANOS: Record<string, "pequeno" | "mediano" | "grande"> = { pequeno: "pequeno", pequena: "pequeno", chico: "pequeno", chica: "pequeno", mini: "pequeno", mediano: "mediano", mediana: "mediano", grande: "grande" };
const ENERGIAS: Record<string, "tranquilo" | "moderado" | "activo"> = { tranquilo: "tranquilo", tranquila: "tranquilo", calmado: "tranquilo", calmada: "tranquilo", moderado: "moderado", moderada: "moderado", medio: "moderado", activo: "activo", activa: "activo", "muy activo": "activo", "muy activa": "activo", alto: "activo", energico: "activo", energica: "activo" };

export function interpretar(filas: string[][]): { filas: FilaImport[]; ignoradas: string[]; falta: string | null } {
  if (!filas.length) return { filas: [], ignoradas: [], falta: "El archivo está vacío." };
  const cab = filas[0].map((h) => MAPA.get(compacto(String(h ?? ""))) ?? null);
  const ignoradas = filas[0].map((h) => String(h ?? "").trim()).filter((h, i) => h && !cab[i]);
  if (!cab.includes("nombre")) return { filas: [], ignoradas, falta: "No encontramos la columna “nombre”. Usa la plantilla para no equivocarte." };

  const celda = (r: string[], c: Campo) => {
    const i = cab.indexOf(c);
    return i >= 0 ? String(r[i] ?? "") : "";
  };

  const out: FilaImport[] = [];
  filas.slice(1).forEach((r, k) => {
    if (r.every((c) => !String(c ?? "").trim())) return; // fila vacía
    const errores: string[] = [];
    const avisos: string[] = [];
    const aviso = (a: string | null) => { if (a) avisos.push(a); };

    const nombre = celda(r, "nombre").trim();
    if (!nombre) errores.push("Falta el nombre");
    else if (nombre.length > 80) errores.push("El nombre es demasiado largo (máximo 80)");

    let species: FilaImport["species"] = null;
    const espTxt = celda(r, "especie");
    if (!quitar(espTxt)) errores.push("Falta la especie (perro, gato u otro)");
    else species = ESPECIES[quitar(espTxt)] ?? (avisos.push(`Especie “${espTxt.trim()}” se guardó como “otro”`), "otro");

    const [sex, a1] = elegir(celda(r, "sexo"), SEXOS, "Sexo"); aviso(a1);
    const [age_group, a2] = elegir(celda(r, "grupo_edad"), GRUPOS, "Grupo de edad"); aviso(a2);
    const [size, a3] = elegir(celda(r, "tamano"), TAMANOS, "Tamaño"); aviso(a3);
    const [energy, a4] = elegir(celda(r, "energia"), ENERGIAS, "Energía"); aviso(a4);
    const [kids, a5] = siNo(celda(r, "ninos")); aviso(a5);
    const [pets, a6] = siNo(celda(r, "otros")); aviso(a6);
    const [ster, a7] = siNo(celda(r, "esterilizado")); aviso(a7);
    const [vac, a8] = siNo(celda(r, "vacunado")); aviso(a8);
    const [pad, a9] = siNo(celda(r, "apadrinable")); aviso(a9);

    let age_text: string | null = celda(r, "edad").trim() || null;
    if (age_text && /^\d+([.,]\d+)?$/.test(age_text)) age_text = `${age_text} ${age_text === "1" ? "año" : "años"}`; // número suelto = años
    if (age_text && age_text.length > 60) { age_text = age_text.slice(0, 60); avisos.push("La edad se recortó a 60 caracteres"); }

    let description: string | null = celda(r, "historia").trim() || null;
    if (description && description.length > 2000) { description = description.slice(0, 2000); avisos.push("La historia se recortó a 2000 caracteres"); }

    out.push({
      fila: k + 2, nombre, species, sex, age_text, age_group, size, energy,
      good_kids: kids === null ? null : kids ? "si" : "no",
      good_pets: pets === null ? null : pets ? "si" : "no",
      sterilized: ster === true, vaccinated: vac === true, sponsorable: pad === true,
      description, errores, avisos, duplicado: null,
    });
  });

  if (out.length > MAX_FILAS) return { filas: [], ignoradas, falta: `El archivo tiene ${out.length} filas; el máximo por importación es ${MAX_FILAS}.` };
  return { filas: out, ignoradas, falta: out.length ? null : "No hay filas con datos debajo de los encabezados." };
}

// Marca como duplicadas las filas que ya existen en ese refugio o que se repiten dentro del archivo
export function marcarDuplicados(filas: FilaImport[], existentes: { name: string; species: string }[]): FilaImport[] {
  const clave = (n: string, e: string | null) => `${quitar(n)}|${e ?? ""}`;
  const ya = new Set(existentes.map((e) => clave(e.name, e.species)));
  const vistos = new Set<string>();
  return filas.map((f) => {
    const k = clave(f.nombre, f.species);
    let duplicado: string | null = null;
    if (!f.errores.length) {
      if (ya.has(k)) duplicado = "Ya existe en este refugio";
      else if (vistos.has(k)) duplicado = "Repetido en el archivo";
      vistos.add(k);
    }
    return { ...f, duplicado };
  });
}

export function aPayload(f: FilaImport, shelterId: string) {
  return {
    shelter_id: shelterId, name: f.nombre, species: f.species, sex: f.sex, age_text: f.age_text, age_group: f.age_group,
    size: f.size, energy: f.energy, good_kids: f.good_kids, good_pets: f.good_pets,
    sterilized: f.sterilized, vaccinated: f.vaccinated, sponsorable: f.sponsorable, sponsors: 0,
    description: f.description, status: "disponible", photo_url: null, photos: [] as string[],
  };
}
