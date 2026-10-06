export const TIPOS = {
  refugio: "Refugio",
  hogar_temporal: "Hogar temporal",
  rescatista: "Rescatista independiente",
  colectivo: "Colectivo de rescate",
} as const;
export type TipoRefugio = keyof typeof TIPOS;

export const nombreTipo = (kind?: string | null) => TIPOS[(kind ?? "refugio") as TipoRefugio] ?? "Refugio";

export const mesAnio = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { month: "long", year: "numeric", timeZone: "America/Hermosillo" });
