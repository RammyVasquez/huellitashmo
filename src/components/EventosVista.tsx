import Link from "next/link";
import EventoFecha from "./EventoFecha";
import PhotoStrip from "./PhotoStrip";
import { enCuantoTiempo, lugarEvento, nombreTipo, partesFecha, resultadosEvento, rutaMapa } from "@/lib/eventos";
import { TIPOS_EVENTO, type EventKind, type EventRow } from "@/lib/types";

const TIPOS = Object.keys(TIPOS_EVENTO) as EventKind[];
const FILTROS: { clave: EventKind | null; nombre: string }[] = [
  { clave: null, nombre: "Todos" },
  { clave: "adopcion", nombre: "Adopción" },
  { clave: "esterilizacion", nombre: "Esterilización y castración" },
  { clave: "acopio", nombre: "Acopio" },
];

function Icono({ tipo }: { tipo: "reloj" | "lugar" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tipo === "reloj" ? (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>) : (<><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.800 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>)}
    </svg>
  );
}


export default function EventosVista({ todos, refugios, tipo }: { todos: EventRow[]; refugios: Map<string, string>; tipo: EventKind | null }) {
  const organiza = (e: EventRow) => (e.shelter_id && refugios.get(e.shelter_id)) || null;
  const visibles = tipo ? todos.filter((e) => e.kind === tipo) : todos;
  const corte = Date.now() - 6 * 3600 * 1000; // un evento sigue "próximo" hasta 6 horas después de empezar
  const proximos = visibles.filter((e) => e.status === "programado" && new Date(e.starts_at).getTime() >= corte);
  const realizados = visibles.filter((e) => e.status === "realizado").sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  // Totales de lo reportado por quienes organizaron (sin ajustes)
  const hechos = todos.filter((e) => e.status === "realizado");
  const suma = (k: "attendees" | "adoptions_count" | "sterilizations_count") => hechos.reduce((t, e) => t + (e[k] ?? 0), 0);
  const totales = [
    { n: hechos.length, t: hechos.length === 1 ? "jornada realizada" : "jornadas realizadas" },
    { n: suma("attendees"), t: "asistentes" },
    { n: suma("adoptions_count"), t: "adopciones" },
    { n: suma("sterilizations_count"), t: "esterilizaciones y castraciones" },
  ].filter((x) => x.n > 0);
  const jsonLd = proximos.map((e) => ({
    "@context": "https://schema.org", "@type": "Event", name: e.title, startDate: e.starts_at, ...(e.ends_at ? { endDate: e.ends_at } : {}),
    eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(e.description ? { description: e.description } : {}),
    location: { "@type": "Place", name: e.place ?? "Hermosillo, Sonora", address: { "@type": "PostalAddress", streetAddress: e.address ?? undefined, addressLocality: "Hermosillo", addressRegion: "Sonora", addressCountry: "MX" } },
    organizer: { "@type": "Organization", name: organiza(e) ?? "Huellitas HMO" },
  }));

  const Tarjeta = ({ e, destacado }: { e: EventRow; destacado: boolean }) => {
    const f = partesFecha(e.starts_at);
    const cuando = enCuantoTiempo(e.starts_at);
    return (
      <article className={`evento${destacado ? " destacado" : ""}`}>
        <EventoFecha iso={e.starts_at} />
        <div className="evento-body">
          <div>
            {destacado && <span className="ev-aviso">Siguiente evento{cuando ? ` · ${cuando}` : ""}</span>}
            {!destacado && cuando && <span className="ev-aviso suave">{cuando}</span>}
            <span className={`tag tipo-${e.kind}`}>{nombreTipo(e)}</span>
          </div>
          <h3>{e.title}</h3>
          <p className="ev-meta">
            <span><Icono tipo="reloj" /> {f.larga}, {f.hora}</span>
            {lugarEvento(e) && <span><Icono tipo="lugar" /> {lugarEvento(e)}</span>}
          </p>
          {e.description && <p style={{ margin: "0 0 .6rem" }}>{e.description}</p>}
          <p className="muted" style={{ margin: "0 0 .8rem", fontSize: ".92rem" }}>
            Organiza: {e.shelter_id && organiza(e) ? <Link href={`/refugios/${e.shelter_id}`}>{organiza(e)}</Link> : "Equipo de Huellitas HMO"}
          </p>
          <div className="actions" style={{ margin: 0 }}>
            {(e.place || e.address) && <a className="btn ghost" href={rutaMapa(e)} target="_blank" rel="noopener noreferrer">Cómo llegar</a>}
            <a className="btn ghost" href={`/api/eventos/${e.id}/calendario`}>Agregar a mi calendario</a>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="wrap page">
      {jsonLd.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}

      <header className="eventos-hero">
        <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Eventos y jornadas</h1>
        <p className="lead" style={{ maxWidth: "58ch" }}>
          Jornadas de adopción, esterilización y castración, y acopio de donativos en especie. Ven, conoce a los animales y ayuda.
        </p>
        {totales.length > 0 && (
          <>
            <ul className="ev-totales" aria-label="Resultados de las jornadas">
              {totales.map((x) => <li key={x.t}><b>{x.n}</b>{x.t}</li>)}
            </ul>
            <p className="muted" style={{ margin: ".5rem 0 0", fontSize: ".88rem" }}>Según lo que reportaron quienes organizaron cada jornada.</p>
          </>
        )}
      </header>

      <nav className="ev-filtros" aria-label="Filtrar por tipo de evento">
        {FILTROS.map((f) => (
          <Link key={f.nombre} href={f.clave ? `/eventos?tipo=${f.clave}` : "/eventos"} aria-current={tipo === f.clave ? "true" : undefined}>{f.nombre}</Link>
        ))}
      </nav>

      <section className="section" aria-labelledby="prox">
        <h2 id="prox">Próximos</h2>
        {proximos.length === 0 ? (
          <div className="empty">
            No hay eventos programados{tipo ? " de este tipo" : ""} por ahora. Vuelve pronto, o <Link href="/nosotros#sumarte">organiza uno con nosotros</Link>.
          </div>
        ) : (
          <div className="ev-lista">
            {proximos.map((e, i) => <Tarjeta key={e.id} e={e} destacado={i === 0} />)}
          </div>
        )}
      </section>

      {realizados.length > 0 && (
        <section className="section" aria-labelledby="pasados">
          <h2 id="pasados">Ya se realizaron</h2>
          <div className="ev-pasados">
            {realizados.map((e) => {
              const res = resultadosEvento(e);
              return (
                <article className="ev-pasado" key={e.id}>
                  {(e.photos?.length ?? 0) > 0 && <PhotoStrip photos={e.photos ?? []} alt={e.title} />}
                  <div className="body">
                    <span className={`tag tipo-${e.kind}`}>{nombreTipo(e)}</span>
                    <h3>{e.title}</h3>
                    <p className="muted" style={{ margin: 0 }}>{partesFecha(e.starts_at).conAnio}{lugarEvento(e) ? ` · ${lugarEvento(e)}` : ""}</p>
                    {res.length > 0 && <div className="ev-chips">{res.map((r) => <span className="ev-chip" key={r}>{r}</span>)}</div>}
                    {e.results_note && <p className="muted clamp" style={{ margin: ".6rem 0 0" }}>{e.results_note}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="ev-cta">
        <h3 style={{ marginTop: 0 }}>¿Organizas una jornada?</h3>
        <p style={{ margin: "0 0 .8rem" }}>Si eres refugio, hogar temporal o rescatista, puedes publicar tus eventos aquí sin costo.</p>
        <Link className="btn" href="/nosotros#sumarte">Cómo sumarme</Link>
      </div>
    </div>
  );
}
