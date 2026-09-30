import { createClient } from "@supabase/supabase-js";

// Nunca reutilizar respuestas guardadas en caché: los datos deben verse al instante
const noStore: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { global: { fetch: noStore } }
);

// Solo para rutas de servidor (API routes). Salta RLS: úsalo con cuidado.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, global: { fetch: noStore } }
  );
}