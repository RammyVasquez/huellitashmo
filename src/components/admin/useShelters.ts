"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Shelter } from "@/lib/types";

export function useShelters() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [cargando, setCargando] = useState(true);
  const reload = useCallback(async () => {
    const { data } = await supabase.from("shelters").select("*").order("name");
    setShelters((data ?? []) as Shelter[]);
    setCargando(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { shelters, reload, cargando };
}
