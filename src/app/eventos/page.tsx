import Link from "next/link";
import PhotoStrip from "@/components/PhotoStrip";
import { supabase } from "@/lib/supabase";
import { TIPOS_EVENTO, type EventRow, type Shelter } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Eventos y jornadas · Huellitas HMO", description: "Jornadas de adopción, esterilización y acopio en Hermosillo." };

const cuando = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", { timeZone: "America/Hermosillo", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const dia = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { timeZone: "America/Hermosillo", day: "numeric", month: "long", year: "numeric" });

export default async function Eventos() {
  const [{ data: ev }, { data: sh }] = await Promise.all([
    supabase.from("events").select("*").in("status", ["programado", "realizado"]).order("starts_at", { ascending: true }),
    supabase.from("shelters").select("id, name"),
  ]);
  const eventos = (ev ?? []) as EventRow[];
  const refugios = new Map(((sh ?? []) as Pick<Shelter, "id" | "name">[]).map((s) => [s.id, s.name]));
  const corte = Date.now() - 6 * 3600 * 1000; // un evento sigue "próximo" hasta 6 horas después de empezar
  const proximos = eventos.filter((e) => e.status === "programado" && new Date(e.starts_at).getTime() >= corte);
  const realizados = eventos.filter((e) => e.status === "realizado").reverse();

  const lugar = (e: EventRow) => [e.place, e.address].filter(Boolean).join(" · ");
  const ruta = (e: EventRow) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.place ?? ""} ${e.address ?? ""} Hermosillo, Sonora`.trim())}`;

  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Eventos y jornadas</h1>
      <p className="lead">Jornadas de adopción, esterilización y acopio de donativos en especie. Ven, conoce a los animales y ayuda.</p>

      <section className="section">
        <h2>Próximos</h2>
        {proximos.length === 0 ? (
          <div className="empty">No hay eventos programados por ahora. Vuelve pronto.</div>
        ) : (
          <div className="grid">
            {proximos.map((e) => (
              <article className="card" key={e.id}>
                <div className="body">
                  <span className="tag">{TIPOS_EVENTO[e.kind]}</span>
                  <h3>{e.title}</h3>
                  <p style={{ margin: 0 }}><b>{cuando(e.starts_at)}</b></p>
                  {lugar(e) && <p className="muted" style={{ margin: ".2rem 0" }}>{lugar(e)}</p>}
                  {e.description && <p className="clamp">{e.description}</p>}
                  <p className="muted" style={{ fontSize: ".92rem" }}>
                    Organiza: {e.shelter_id && refugios.get(e.shelter_id) ? <Link href={`/refugios/${e.shelter_id}`}>{refugios.get(e.shelter_id)}</Link> : "Equipo de Huellitas HMO"}
                  </p>
                  {(e.place || e.address) && (
                    <div className="actions"><a className="btn ghost" href={ruta(e)} target="_blank" rel="noopener noreferrer">Cómo llegar</a></div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {realizados.length > 0 && (
        <section className="section">
          <h2>Ya se realizaron</h2>
          <div className="grid reportes">
            {realizados.map((e) => (
              <article className="card" key={e.id}>
                {(e.photos?.length ?? 0) > 0 && <PhotoStrip photos={e.photos ?? []} alt={e.title} />}
                <div className="body">
                  <span className="tag ok">{TIPOS_EVENTO[e.kind]}</span>
                  <h3>{e.title}</h3>
                  <p className="muted" style={{ margin: 0 }}>{dia(e.starts_at)}{lugar(e) ? ` · ${lugar(e)}` : ""}</p>
                  <p style={{ margin: ".4rem 0 0" }}>
                    {[
                      e.attendees != null ? `${e.attendees} asistentes` : "",
                      e.adoptions_count != null ? `${e.adoptions_count} adopciones` : "",
                      e.sterilizations_count != null ? `${e.sterilizations_count} esterilizaciones` : "",
                    ].filter(Boolean).join(" · ")}
                  </p>
                  {e.results_note && <p className="muted clamp">{e.results_note}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
