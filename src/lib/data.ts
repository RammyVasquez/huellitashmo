import { cache } from "react";
import { supabase } from "@/lib/supabase";
import type { Animal, Shelter } from "@/lib/types";

// cache(): la página y su metadata comparten una sola consulta por petición
export const getAnimal = cache(async (id: string) => {
  const { data } = await supabase.from("animals").select("*").eq("id", id).single();
  return (data as Animal) ?? null;
});

export const getShelter = cache(async (id: string) => {
  const { data } = await supabase.from("shelters").select("*").eq("id", id).single();
  return (data as Shelter) ?? null;
});
