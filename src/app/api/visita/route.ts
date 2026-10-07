import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Suma una visita al contador del día para esa fuente. Nunca guarda IP, agente ni identificadores.
export async function POST(req: Request) {
  try {
    const ua = (req.headers.get("user-agent") ?? "").toLowerCase();
    if (/bot|crawl|spider|preview|facebookexternalhit|headless|lighthouse/.test(ua)) return new Response(null, { status: 204 });
    const { fuente } = (await req.json()) as { fuente?: string };
    const f = String(fuente ?? "").toLowerCase();
    await supabaseAdmin().rpc("track_visit", { p_source: /^[a-z0-9_-]{1,30}$/.test(f) ? f : "otro" });
  } catch { /* contar visitas nunca debe afectar al sitio */ }
  return new Response(null, { status: 204 });
}
