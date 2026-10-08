import { TIPOS_EVENTO, type EventRow } from "@/lib/types";

const TZ = "America/Hermosillo";

export function partesFecha(iso: string) {
  const d = new Date(iso);
  const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("es-MX", { timeZone: TZ, ...o });
  return {
    dia: f({ day: "numeric" }),
    mes: f({ month: "short" }).replace(".", ""),
    semana: f({ weekday: "short" }).replace(".", ""),
    larga: f({ weekday: "long", day: "numeric", month: "long" }),
    conAnio: f({ day: "numeric", month: "long", year: "numeric" }),
    hora: d.toLocaleTimeString("es-MX", { timeZone: TZ, hour: "numeric", minute: "2-digit" }),
  };
}

const diaHmo = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: TZ });

// "Hoy", "Mañana", "En 3 días" (solo si falta poco)
export function enCuantoTiempo(iso: string): string {
  const diff = Math.round((Date.parse(diaHmo(new Date(iso))) - Date.parse(diaHmo(new Date()))) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff >= 2 && diff <= 7) return `En ${diff} días`;
  return "";
}

export const lugarEvento = (e: EventRow) => [e.place, e.address].filter(Boolean).join(" · ");
export const rutaMapa = (e: EventRow) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.place ?? ""} ${e.address ?? ""} Hermosillo, Sonora`.trim())}`;

export function resultadosEvento(e: EventRow): string[] {
  return [
    e.attendees != null ? `${e.attendees} asistentes` : "",
    e.adoptions_count != null ? `${e.adoptions_count} ${e.adoptions_count === 1 ? "adopción" : "adopciones"}` : "",
    e.sterilizations_count != null ? `${e.sterilizations_count} esterilizaciones y castraciones` : "",
  ].filter(Boolean);
}

export const nombreTipo = (e: EventRow) => TIPOS_EVENTO[e.kind] ?? "Evento";

// ---- Archivo de calendario (.ics) para agregar el evento al teléfono ----
const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function plegar(linea: string) {
  const partes: string[] = [];
  let resto = linea;
  while (Buffer.byteLength(resto) > 74) {
    let corte = 74;
    while (Buffer.byteLength(resto.slice(0, corte)) > 74) corte--;
    partes.push(resto.slice(0, corte));
    resto = ` ${resto.slice(corte)}`;
  }
  partes.push(resto);
  return partes.join("\r\n");
}

export function construirIcs(e: EventRow, organizador: string, url: string): string {
  const ini = new Date(e.starts_at);
  const fin = e.ends_at ? new Date(e.ends_at) : new Date(ini.getTime() + 2 * 3600 * 1000);
  const lineas = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Huellitas HMO//Eventos//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@huellitashmo.site`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(ini)}`,
    `DTEND:${utc(fin)}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc([e.description ?? "", `Organiza: ${organizador}`, `Más información: ${url}`].filter(Boolean).join("\n\n"))}`,
    ...(lugarEvento(e) ? [`LOCATION:${esc(`${lugarEvento(e)}, Hermosillo, Sonora`)}`] : []),
    `URL:${url}`,
    ...(e.status === "cancelado" ? ["STATUS:CANCELLED"] : []),
    "END:VEVENT", "END:VCALENDAR",
  ];
  return `${lineas.map(plegar).join("\r\n")}\r\n`;
}
