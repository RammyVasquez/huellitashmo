import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { PublicReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Reportes({ searchParams }: { searchParams: { tipo?: string } }) {
  let q = supabase.from("reports_public").select("*").eq("status", "activo").order("created_at", { ascending: false });
  if (searchParams.tipo === "perdido" || searchParams.tipo === "encontrado") q = q.eq("kind", searchParams.tipo);
  const { data } = await q;
  const reports = (data ?? []) as PublicReport[];

  return (
    <>
      <h1>Perdidos y encontrados</h1>
      <p>
        <Link href="/reportes">Todos</Link> · <Link href="/reportes?tipo=perdido">Perdidos</Link> ·{" "}
        <Link href="/reportes?tipo=encontrado">Encontrados</Link>
      </p>
      {reports.length === 0 ? (
        <div className="empty">No hay reportes activos. Si viste o perdiste una mascota, cuéntanos.</div>
      ) : (
        <div className="grid">
          {reports.map((r) => (
            <div key={r.id} className="card">
              {r.photo_url ? <img src={r.photo_url} alt={`Mascota ${r.kind}`} /> : <div className="ph" />}
              <div className="body">
                <span className={`tag ${r.kind}`}>{r.kind}</span>
                <span className="tag">{r.species}</span>
                <p>{r.description}</p>
                <small>{r.zone}</small>
                <p>
                  {/* El teléfono nunca llega al navegador: la ruta /api/contacto redirige a WhatsApp */}
                  <a className="btn" href={`/api/contacto/${r.id}`}>Contactar por WhatsApp</a>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
