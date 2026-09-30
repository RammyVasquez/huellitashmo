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
};

export type ImpactStats = {
  reportes: number;
  reunificaciones: number;
  animales_registrados: number;
  adopciones: number;
  esterilizados: number;
  padrinos: number;
};

export type AdminReport = {
  id: string;
  kind: "perdido" | "encontrado";
  species: Species;
  description: string;
  photo_url: string | null;
  zone: string | null;
  contact_whatsapp: string;
  status: "pendiente" | "activo" | "reunificado" | "cerrado";
  created_at: string;
};
