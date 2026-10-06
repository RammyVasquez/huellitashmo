export type Species = "perro" | "gato" | "otro";

export type Animal = {
  id: string;
  shelter_id: string | null;
  name: string;
  species: Species;
  sex: "macho" | "hembra" | null;
  age_text: string | null;
  description: string | null;
  photo_url: string | null;
  status: "disponible" | "en_proceso" | "adoptado";
  sterilized: boolean;
  vaccinated: boolean;
  sponsorable: boolean;
  sponsors: number;
  created_at: string;
  size: "pequeno" | "mediano" | "grande" | null;
  energy: "tranquilo" | "moderado" | "activo" | null;
  age_group: "cachorro" | "joven" | "adulto" | "senior" | null;
  good_kids: "si" | "no" | null;
  good_pets: "si" | "no" | null;
};

export type Shelter = {
  id: string;
  name: string;
  whatsapp: string | null;
  address: string | null;
  drop_off_hours: string | null;
  logo_url: string | null;
  about: string | null;
  lat: number | null;
  lng: number | null;
  facebook_url: string | null;
  instagram_url: string | null;
};

export type ShelterNeed = {
  id: string;
  shelter_id: string;
  item: string;
  detail: string | null;
  urgent: boolean;
  fulfilled: boolean;
};

export type PublicReport = {
  id: string;
  kind: "perdido" | "encontrado";
  species: Species;
  description: string;
  photo_url: string | null;
  lat: number | null;
  lng: number | null;
  zone: string | null;
  status: "activo" | "reunificado";
  created_at: string;
  photos: string[] | null;
  code?: string;
};

export type ImpactStats = {
  reportes: number;
  reunificaciones: number;
  animales_registrados: number;
  adopciones: number;
  esterilizados: number;
  padrinos: number;
  auxiliados?: number;
  seguimientos?: number;
};

export type AdminReport = {
  id: string;
  kind: "perdido" | "encontrado";
  species: Species;
  description: string;
  photo_url: string | null;
  zone: string | null;
  lat: number | null;
  lng: number | null;
  contact_whatsapp: string;
  status: "pendiente" | "activo" | "reunificado" | "cerrado";
  created_at: string;
  photos: string[] | null;
};

export type WelfareCategory = "atropellado_herido" | "enfermo" | "maltrato" | "abandono_encierro" | "otro";

export type WelfarePublic = {
  id: string;
  category: "atropellado_herido" | "enfermo";
  species: Species;
  urgent: boolean;
  description: string;
  photos: string[] | null;
  zone: string;
  lat: number | null;
  lng: number | null;
  status: "activo" | "en_atencion";
  created_at: string;
  allow_contact: boolean;
};

export type AdminWelfare = {
  id: string;
  category: WelfareCategory;
  species: Species;
  urgent: boolean;
  description: string;
  photos: string[] | null;
  zone: string;
  lat: number | null;
  lng: number | null;
  contact_whatsapp: string | null;
  allow_contact: boolean;
  status: "pendiente" | "activo" | "en_atencion" | "resuelto" | "cerrado";
  admin_notes: string | null;
  created_at: string;
};

export type HelpContact = { id: string; name: string; phone: string; note: string | null; sort: number };

export const CATEGORIAS: Record<WelfareCategory, { titulo: string; texto: string; publica: boolean }> = {
  atropellado_herido: { titulo: "Atropellado o herido", texto: "Necesita atención médica", publica: true },
  enfermo: { titulo: "Enfermo o desnutrido", texto: "Se ve mal de salud o muy flaco", publica: true },
  maltrato: { titulo: "Maltrato o crueldad", texto: "Golpes, abuso o violencia", publica: false },
  abandono_encierro: { titulo: "Abandono o encierro", texto: "Encadenado, sin agua ni sombra", publica: false },
  otro: { titulo: "Otra situación de riesgo", texto: "Atrapado, en peligro u otra", publica: false },
};

export type AdoptionRequest = {
  id: string;
  animal_id: string;
  applicant_name: string;
  whatsapp: string;
  colonia: string;
  housing: "casa_patio" | "casa_sin_patio" | "departamento" | "otro";
  tenure: "propia" | "renta";
  landlord_ok: boolean | null;
  household_size: number;
  has_kids: boolean;
  has_pets: boolean;
  pets_note: string | null;
  experience: string | null;
  away_plan: string | null;
  motivation: string;
  agrees_visit: boolean;
  agrees_commitment: boolean;
  status: "nueva" | "contactado" | "entrevista" | "visita" | "aprobada" | "rechazada" | "adoptado" | "cancelada";
  admin_notes: string | null;
  adopted_at: string | null;
  created_at: string;
  animals: Pick<Animal, "name" | "photo_url" | "species" | "shelter_id" | "status" | "good_kids" | "good_pets" | "size" | "energy"> | null;
};

export type Followup = {
  id: string;
  request_id: string;
  token: string;
  stage: 1 | 3 | 6;
  due_date: string;
  status: "pendiente" | "enviado" | "respondido" | "omitido";
  sent_at: string | null;
  answered_at: string | null;
  adapted: "muy_bien" | "bien" | "con_dificultades" | null;
  notes: string | null;
  photos: string[] | null;
  photo_consent: boolean;
  adoption_requests: { applicant_name: string; whatsapp: string; animals: { name: string } | null } | null;
};
