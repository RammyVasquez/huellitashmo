import Link from "next/link";
import Contacto from "@/components/Contacto";
import MesBars from "@/components/MesBars";
import { supabase } from "@/lib/supabase";
import { TIPOS_EVENTO, type EventRow, type ImpactStats, type MesImpacto } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Impacto y transparencia · Huellitas HMO" };

type ShelterRow = { id: string; name: string; logo_url: string | null };

const fecha = (d: Date, conHora = false) =>
  d.toLocaleString("es-MX", { timeZone: "America/Hermosillo", day: "numeric", month: "long", year: "numeric", ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}) });

export default async function Impacto() {
  const [{ data: st }, { data: sh }, { data: primero }, { data: ms }, { data: ev }] = await Promise.all([
    supabase.from("impact_stats").select("*").single(),
    supabase.from("shelters").select("id, name, logo_url").order("name"),
    supabase.from("animals").select("created_at").order("created_at", { ascending: true }).limit(1),
    supabase.from("impact_by_month").select("*").order("mes"),
    supabase.from("events").select("*").eq("status", "realizado").order("starts_at", { ascending: false }).limit(6),
  ]);
  const s = (st ?? {}) as Partial<ImpactStats>;
  const shelters = (sh ?? []) as ShelterRow[];
  const meses = (ms ?? []) as MesImpacto[];
  const eventos = (ev ?? []) as EventRow[];
  const desde = primero?.[0]?.created_at ? new Date(primero[0].created_at) : null;

  const cifras: [number, string][] = [
    [s.animales_registrados ?? 0, "animales registrados"],
    [s.adopciones ?? 0, "adopciones"],
    [s.esterilizados ?? 0, "animales esterilizados"],
    [s.padrinos ?? 0, "padrinos"],
    [s.reunificaciones ?? 0, "familias reunidas"],
    [s.auxiliados ?? 0, "animales auxiliados"],
    [s.seguimientos ?? 0, "seguimientos de adopción respondidos"],
    [s.eventos ?? 0, "eventos realizados"],
    [s.historias ?? 0, "historias publicadas"],
  ];

  return (
    <>
      <div className="wrap page">
        <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Impacto y transparencia</h1>
        <p className="lead">
          Estas cifras salen directo de la base de datos de la plataforma, sin ajustes manuales, y se actualizan con cada cambio.
        </p>
        <p className="updated">
          {desde && <>Registros desde el {fecha(desde)}. </>}Consultado el {fecha(new Date(), true)} (hora de Hermosillo).
        </p>
      </div>

      <section className="impact" aria-label="Cifras de impacto">
        <div className="wrap">
          <div className="stats">
            {cifras.map(([n, label]) => (
              <div className="stat" key={label}><b>{n}</b><span>{label}</span></div>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="section">
          <div className="section-head">
            <h2>Actividad por mes</h2>
            <a className="btn" href="/api/informe">Descargar informe en PDF</a>
          </div>
          <p className="muted" style={{ maxWidth: "62ch" }}>Últimos 12 meses, calculados a partir de los registros de la plataforma.</p>
          <div className="graficas">
            <MesBars titulo="Reportes de mascotas perdidas y encontradas" meses={meses.map((m) => m.mes)} valores={meses.map((m) => m.reportes)} />
            <MesBars titulo="Adopciones" meses={meses.map((m) => m.mes)} valores={meses.map((m) => m.adopciones)} />
            <MesBars titulo="Animales auxiliados (rescates resueltos)" meses={meses.map((m) => m.mes)} valores={meses.map((m) => m.auxiliados)} />
            <MesBars titulo="Animales registrados" meses={meses.map((m) => m.mes)} valores={meses.map((m) => m.animales_registrados)} />
          </div>
        </section>

        {eventos.length > 0 && (
          <section className="section">
            <h2>Eventos y jornadas realizados</h2>
            <div className="grid" style={{ marginTop: ".8rem" }}>
              {eventos.map((e) => (
                <div className="card" key={e.id}>
                  <div className="body">
                    <span className="tag">{TIPOS_EVENTO[e.kind]}</span>
                    <h3>{e.title}</h3>
                    <p className="muted">{fecha(new Date(e.starts_at))}</p>
                    <p style={{ margin: 0 }}>
                      {[
                        e.attendees != null ? `${e.attendees} asistentes` : "",
                        e.adoptions_count != null ? `${e.adoptions_count} adopciones` : "",
                        e.sterilizations_count != null ? `${e.sterilizations_count} esterilizaciones` : "",
                      ].filter(Boolean).join(" · ")}
                    </p>
                    {e.results_note && <p className="muted">{e.results_note}</p>}
                  </div>
                </div>
              ))}
            </div>
            <p><Link href="/eventos">Ver todos los eventos</Link></p>
          </section>
        )}
      </div>

      <div className="wrap prose">
        <h2>Cómo contamos cada cifra</h2>
        <p>Preferimos explicar con exactitud qué significa cada número para que nadie se confunda.</p>
        <dl className="defs">
          <dt>Animales registrados</dt>
          <dd>Animales dados de alta en la plataforma por un refugio, estén o no disponibles.</dd>
          <dt>Adopciones</dt>
          <dd>Animales que el refugio marcó como adoptados en su panel. Es el refugio quien lo confirma.</dd>
          <dt>Animales esterilizados</dt>
          <dd>Animales registrados con el dato de “esterilizado”. Indica su estado, no necesariamente que la esterilización se haya hecho gracias a la plataforma.</dd>
          <dt>Padrinos</dt>
          <dd>Número de padrinos que reporta cada refugio por animal. Es un dato que ellos actualizan, no un conteo automático.</dd>
          <dt>Familias reunidas</dt>
          <dd>Reportes de mascotas perdidas o encontradas que el equipo administrador marcó como reunificados tras confirmarlo con las personas.</dd>
          <dt>Seguimientos de adopción respondidos</dt>
          <dd>Familias que, después de adoptar, respondieron la encuesta de seguimiento (a 1, 3 o 6 meses) contando cómo va la adaptación.</dd>
          <dt>Animales auxiliados</dt>
          <dd>Casos de animales heridos, enfermos o en riesgo que el equipo marcó como resueltos.</dd>
          <dt>Eventos realizados</dt>
          <dd>Jornadas de adopción, esterilización o acopio que un refugio o el equipo marcó como realizadas. Las cifras de cada evento (asistentes, adopciones, esterilizaciones) las captura quien lo organizó.</dd>
          <dt>Historias publicadas</dt>
          <dd>Historias de adopción publicadas en el sitio con la autorización de la familia.</dd>
        </dl>

        <h2>Cómo cuidamos la calidad de los datos</h2>
        <ul>
          <li>Cada reporte se revisa antes de publicarse.</li>
          <li>Las cifras no se editan a mano: se calculan a partir de los registros.</li>
          <li>Las pruebas internas se eliminan antes de empezar a contar resultados.</li>
        </ul>

        <h2>Refugios en la plataforma</h2>
        {shelters.length === 0 ? (
          <p className="muted">Pronto se sumarán refugios.</p>
        ) : (
          <div className="shelter-logos">
            {shelters.map((x) => (
              <Link key={x.id} href={`/refugios/${x.id}`} className="shelter-chip">
                {x.logo_url ? <img src={x.logo_url} alt="" /> : <span className="logo fallback" aria-hidden="true">{x.name.trim().charAt(0).toUpperCase()}</span>}
                {x.name}
              </Link>
            ))}
          </div>
        )}

        <h2>Qué significa “Verificado”</h2>
        <p>
          El sello aparece cuando el equipo de Huellitas HMO comprobó la identidad de la persona u organización (por ejemplo, hablando con ella y revisando su trabajo público) y que realiza labores de rescate o cuidado de animales en Hermosillo. No es una certificación oficial ni una garantía: si ves algo extraño, escríbenos.
        </p>

        <h2>Cómo se sostiene el proyecto</h2>
        <ul>
          <li>Funciona con servicios de plan gratuito y no cobra ni maneja dinero.</li>
          <li>Los donativos son en especie y se entregan directo a cada refugio.</li>
          <li>Tu privacidad: tu WhatsApp nunca se publica. Lee el <Link href="/privacidad">aviso de privacidad</Link> y las <Link href="/reglas">reglas de uso</Link>.</li>
        </ul>
        <p><Contacto prefijo="¿Quieres sumar a tu refugio o tienes dudas? Escríbenos a" /></p>
      </div>
    </>
  );
}
