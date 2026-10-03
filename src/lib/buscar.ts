// Búsqueda por texto tolerante: ignora acentos y mayúsculas, acepta palabras incompletas
// ("caf" encuentra "café") y entiende sinónimos comunes ("marrón", "chocolate" = café).
export const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

type Grupo = { etiqueta: string; miembros: string[]; comparable: boolean };
const g = (etiqueta: string, miembros: string[], comparable = true): Grupo => ({ etiqueta, miembros: miembros.map(normalizar), comparable });

const GRUPOS: Grupo[] = [
  g("perro", ["perro", "perrito", "perrita", "lomito", "lomita"], false),
  g("gato", ["gato", "gatito", "gatita", "michi", "minino", "minina"], false),
  g("perdido", ["perdido", "perdida", "extraviado", "extraviada"], false),
  g("encontrado", ["encontrado", "encontrada", "hallado", "hallada"], false),
  g("café", ["cafe", "marron", "chocolate", "canela"]),
  g("negro", ["negro", "negra", "oscuro", "oscura"]),
  g("blanco", ["blanco", "blanca", "claro", "clara"]),
  g("amarillo", ["amarillo", "amarilla", "dorado", "dorada", "beige", "crema", "arena"]),
  g("gris", ["gris", "plomo", "grisaceo"]),
  g("manchado", ["manchado", "manchada", "mancha", "manchas", "moteado", "pintas"]),
  g("pequeño", ["pequeno", "pequena", "chico", "chica", "chiquito", "chiquita", "mini"]),
  g("grande", ["grande", "enorme", "gigante"]),
  g("cachorro", ["cachorro", "cachorra", "bebe"]),
  g("collar", ["collar", "correa", "placa", "arnes"]),
  g("tranquilo", ["tranquilo", "tranquila", "calmado", "calmada"]),
  g("activo", ["activo", "activa", "energico", "energica", "jugueton", "juguetona"]),
  g("herido", ["herido", "herida", "lastimado", "lastimada", "cojo", "coja"]),
  g("flaco", ["flaco", "flaca", "desnutrido", "desnutrida", "delgado", "delgada"]),
];

const palabrasDe = (s: string) => normalizar(s).split(/[^a-z0-9]+/).filter(Boolean);

function tiene(palabras: string[], miembros: string[]) {
  return miembros.some((m) => palabras.some((w) => w.startsWith(m)));
}

// ¿El texto contiene todas las palabras de la consulta (o sus sinónimos)? Sin consulta, todo coincide.
export function coincide(consulta: string, texto: string): boolean {
  const tokens = palabrasDe(consulta).filter((t) => t.length >= 2);
  if (!tokens.length) return true;
  const palabras = palabrasDe(texto);
  return tokens.every((t) => {
    if (palabras.some((w) => w.startsWith(t))) return true;
    const grupo = GRUPOS.find((gr) => gr.miembros.some((m) => t === m || (t.length > m.length && t.startsWith(m))));
    return !!grupo && tiene(palabras, grupo.miembros);
  });
}

// Rasgos que aparecen en las dos descripciones (color, collar, tamaño...)
export function enComun(a: string, b: string): string[] {
  const pa = palabrasDe(a), pb = palabrasDe(b);
  return GRUPOS.filter((gr) => gr.comparable && tiene(pa, gr.miembros) && tiene(pb, gr.miembros)).map((gr) => gr.etiqueta);
}
