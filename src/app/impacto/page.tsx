import Link from "next/link";
import Contacto from "@/components/Contacto";
import { supabase } from "@/lib/supabase";
import type { ImpactStats } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Impacto y transparencia · Huellitas HMO" };

type ShelterRow = { id: string; name: string; logo_url: string | null };

const fecha = (d: Date, conHora = false) =>
  d.toLocaleString("es-MX", { timeZone: "America/Hermosillo", day: "numeric", month: "long", year: "numeric", ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}) });

export default async function Impacto() {
  const [{ data: st }, { data: sh }, { data: primero }] = await Promise.all([
    supabase.from("impact_stats").select("*").single(),
    supabase.from("shelters").select("id, name, logo_url").order("name"),
    supabase.from("animals").select("created_at").order("created_at", { ascending: true }).limit(1),
  ]);
  const s = (st ?? {}) as Partial<ImpactStats>;
  const shelters = (sh ?? []) as ShelterRow[];
  const desde = primero?.[0]?.created_at ? new Date(primero[0].created_at) : null;

  const cifras: [number, string][] = [
    [s.animales_registrados ?? 0, "animales registrados"],
    [s.adopciones ?? 0, "adopciones"],
    [s.esterilizados ?? 0, "animales esterilizados"],
    [s.padrinos ?? 0, "padrinos"],
    [s.reunificaciones ?? 0, "familias reunidas"],
    [s.auxiliados ?? 0, "animales auxiliados"],
    [s.seguimientos ?? 0, "seguimientos de adopción respondidos"],
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
