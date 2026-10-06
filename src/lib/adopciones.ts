import type { AdoptionRequest } from "@/lib/types";

export const ESTADOS_SOLICITUD = ["nueva", "contactado", "entrevista", "visita", "aprobada", "rechazada", "adoptado", "cancelada"] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

export const ETIQUETA_ESTADO: Record<EstadoSolicitud, string> = {
  nueva: "Nueva", contactado: "Contactado", entrevista: "Entrevista", visita: "Visita al hogar",
  aprobada: "Aprobada", rechazada: "Rechazada", adoptado: "Adoptado", cancelada: "Cancelada",
};
export const ABIERTAS: EstadoSolicitud[] = ["nueva", "contactado", "entrevista", "visita", "aprobada"];

export const VIVIENDA = { casa_patio: "Casa con patio", casa_sin_patio: "Casa sin patio", departamento: "Departamento", otro: "Otro" } as const;

export const ADAPTACION = { muy_bien: "Se adaptó muy bien", bien: "Se adaptó bien", con_dificultades: "Con dificultades" } as const;

// Avisos para quien revisa la solicitud: cruzan lo que dijo la familia con el carácter registrado del animal
export function alertas(r: AdoptionRequest): string[] {
  const a = r.animals;
  const out: string[] = [];
  if (a?.status === "adoptado") out.push("El animal ya fue adoptado");
  if (r.has_kids && a?.good_kids === "no") out.push("Hay niños en el hogar y el animal no se lleva bien con niños");
  if (r.has_pets && a?.good_pets === "no") out.push("Tiene otros animales y este no se lleva bien con otros animales");
  if (r.tenure === "renta" && r.landlord_ok === false) out.push("Renta y no tiene permiso del propietario");
  if (r.tenure === "renta" && r.landlord_ok === null) out.push("Renta: aún no confirma el permiso del propietario");
  if (r.housing === "departamento" && (a?.size === "grande" || a?.energy === "activo")) out.push("Vive en departamento y el animal es grande o muy activo");
  return out;
}

const corto = (s: string | null, n = 220) => (s && s.length > n ? `${s.slice(0, n)}…` : s ?? "—");

// Resumen para mandar al refugio por WhatsApp (el refugio decide; la plataforma no aprueba adopciones)
export function resumenParaRefugio(r: AdoptionRequest) {
  return [
    `Solicitud de adopción de ${r.animals?.name ?? "un animal"} (Huellitas HMO)`,
    `Nombre: ${r.applicant_name}`,
    `WhatsApp: ${r.whatsapp}`,
    `Colonia: ${r.colonia}`,
    `Vivienda: ${VIVIENDA[r.housing]} (${r.tenure === "renta" ? "renta" : "propia"}${r.tenure === "renta" ? `, permiso del propietario: ${r.landlord_ok === null ? "sin confirmar" : r.landlord_ok ? "sí" : "no"}` : ""})`,
    `Personas en casa: ${r.household_size} · Niños: ${r.has_kids ? "sí" : "no"} · Otros animales: ${r.has_pets ? `sí (${corto(r.pets_note, 80)})` : "no"}`,
    `Experiencia: ${corto(r.experience)}`,
    `Cuando viaja: ${corto(r.away_plan)}`,
    `Por qué quiere adoptar: ${corto(r.motivation)}`,
  ].join("\n");
}

export function sumarMeses(meses: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}
