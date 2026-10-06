import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AnimalCard from "@/components/AnimalCard";
import FotoFit from "@/components/FotoFit";
import { EMERGENCIAS } from "@/lib/primeros-auxilios";
import type { Animal, ImpactStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ data: st }, { data: an }] = await Promise.all([
    supabase.from("impact_stats").select("*").single(),
    supabase.from("animals").select("*").neq("status", "adoptado").order("created_at", { ascending: false }).limit(8),
  ]);
  const s = (st ?? {
    reportes: 0, reunificaciones: 0, animales_registrados: 0,
    adopciones: 0, esterilizados: 0, padrinos: 0, auxiliados: 0,
  }) as ImpactStats;
  const animals = (an ?? []) as Animal[];
  const featured = animals.find((a) => a.photo_url) ?? null;
  const others = animals.filter((a) => a.id !== featured?.id).slice(0, 4);

  const items: [number, string][] = [
    [s.animales_registrados, "animales registrados"],
    [s.adopciones, "adopciones"],
    [s.esterilizados, "esterilizados"],
    [s.padrinos, "padrinos"],
    [s.reunificaciones, "familias reunidas"],
    [s.auxiliados ?? 0, "animales auxiliados"],
  ];

  // En la portada solo se muestran las cifras con resultados; en /impacto aparecen todas con su definición
  const logros = items.filter(([n]) => n > 0);

  return (
    <>
      <div className="wrap hero">
        <div>
          <h1>Adoptar cambia dos vidas: la suya y la tuya.</h1>
          <p className="lead">
            <span className="solo-escritorio">
              En los refugios de Hermosillo hay perros y gatos esperando una familia. Conócelos, adopta,
              apadrina o ayuda con lo que tengas en casa. No necesitas dinero para hacer la diferencia.
            </span>
            <span className="solo-movil">Perros y gatos de Hermosillo esperan una familia. Conócelos y dale una segunda oportunidad.</span>
          </p>
          <div className="actions">
            <Link className="btn" href="/animales">Ver animales</Link>
            <Link className="btn ghost" href="/match">Encuentra tu match</Link>
          </div>
          <p className="confianza">Gratis · aquí no se maneja dinero</p>
        </div>
        {featured ? (
          <Link href={`/animales/${featured.id}`} className="hero-photo solo-escritorio" aria-label={`Conoce a ${featured.name}`}>
            <FotoFit eager src={featured.photo_url!} alt={`Foto de ${featured.name}`} />
            <span className="hero-tag">Conoce a {featured.name}</span>
          </Link>
        ) : (
          <div className="hero-photo solo-escritorio"><div className="ph" /></div>
        )}
      </div>

      {/* Celular: carrusel para deslizar, justo después de la presentación */}
      <div className="wrap solo-movil">
        <section className="carrusel-sec" aria-label="Animales que buscan hogar">
          <div className="section-head" style={{ marginBottom: ".6rem" }}>
            <h2 style={{ fontSize: "1.5rem" }}>Buscan hogar</h2>
            <Link href="/animales">Ver todos</Link>
          </div>
          {animals.length === 0 ? (
            <div className="empty">Pronto compartiremos aquí a los animales de los refugios.</div>
          ) : (
            <div className="carrusel">
              {animals.map((a, k) => (
                <Link key={a.id} href={`/animales/${a.id}`} className="card carrusel-item">
                  {a.photo_url ? <FotoFit eager={k === 0} src={a.photo_url} alt={`Foto de ${a.name}`} /> : <div className="ph" />}
                  <div className="body">
                    <h3>{a.name}</h3>
                    <div>
                      <span className="tag">{a.species}</span>
                      {a.age_text && <span className="tag">{a.age_text}</span>}
                      {a.sterilized && <span className="tag ok">esterilizado</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {logros.length >= 2 && (
      <section className="impact" aria-label="Impacto de la plataforma">
        <div className="wrap">
          <h2>Lo que ya logramos juntos</h2>
          <div className="stats">
            {logros.map(([n, label]) => (
              <div className="stat" key={label}><b>{n}</b><span>{label}</span></div>
            ))}
          </div>
          <p style={{ margin: "1.2rem 0 0" }}><Link href="/impacto">Cómo contamos estas cifras</Link></p>
        </div>
      </section>
      )}

      <div className="wrap">
        <section className="aux-band" aria-labelledby="aux-titulo">
          <div>
            <h2 id="aux-titulo">¿Emergencia con tu mascota?</h2>
            <p style={{ margin: 0 }}>Qué hacer en los primeros minutos, mientras llegas con el veterinario.</p>
          </div>
          <div className="chips" style={{ margin: 0 }}>
            {EMERGENCIAS.map((e) => <Link key={e.id} href={`/primeros-auxilios#${e.id}`}>{e.titulo}</Link>)}
          </div>
          <div><Link className="btn call" href="/primeros-auxilios">Ver todos los primeros auxilios</Link></div>
        </section>
      </div>

      <div className="wrap">
        <section className="section">
          <h2>Así cambia una vida</h2>
          <div className="three">
            <div>
              <h3>Para el animal</h3>
              <p>Pasa de un espacio compartido a un hogar con rutina, cariño y atención veterinaria. Un animal que se siente seguro aprende a confiar otra vez.</p>
            </div>
            <div>
              <h3>Para el refugio</h3>
              <p>Cada adopción libera un lugar para rescatar al siguiente animal. Con una sola familia nueva, el refugio puede ayudar a otro que hoy está en la calle.</p>
            </div>
            <div>
              <h3>Para ti</h3>
              <p>Compañía todos los días, una razón para salir a caminar y la tranquilidad de haber dado una segunda oportunidad a quien la necesitaba.</p>
            </div>
          </div>
        </section>

        <section className="section solo-escritorio">
          <div className="section-head">
            <h2>Ellos buscan casa</h2>
            <Link href="/animales">Ver todos</Link>
          </div>
          {others.length === 0 ? (
            <div className="empty">Pronto compartiremos aquí a los animales de los refugios.</div>
          ) : (
            <div className="grid">{others.map((a) => <AnimalCard key={a.id} a={a} />)}</div>
          )}
        </section>

        <section className="section">
          <h2>Adoptar es un proceso sencillo</h2>
          <ol className="steps">
            <li><div><h3>Conoce</h3><p>Elige a quien te llame la atención y lee su historia.</p></div></li>
            <li><div><h3>Platica con el refugio</h3><p>Te escribimos por WhatsApp y te cuentan cómo es su carácter y qué cuidados necesita.</p></div></li>
            <li><div><h3>Visita y convive</h3><p>Conócelo en persona antes de decidir.</p></div></li>
            <li><div><h3>Llévalo a casa</h3><p>Firmas un compromiso de cuidado y el refugio te acompaña después.</p></div></li>
          </ol>
          <p style={{ marginTop: "1.2rem" }}><Link className="btn alt" href="/adopta">Ver requisitos y preguntas frecuentes</Link></p>
        </section>

        <section className="section">
          <div className="band alerta">
            <h2>¿Viste un animal herido, enfermo o maltratado?</h2>
            <p>Avísanos. Revisamos cada reporte y lo canalizamos con quien pueda ayudar. Puedes reportar sin dejar tus datos.</p>
            <div className="actions">
              <Link className="btn" href="/rescate/nuevo">Reportar un animal en riesgo</Link>
              <Link className="btn ghost" href="/rescate">Ver casos que necesitan ayuda</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="band">
            <h2>¿No puedes adoptar? También puedes ayudar</h2>
            <p>
              Los refugios necesitan croquetas, cobijas, arena, medicinas y más. Aquí no pedimos dinero: tú llevas
              el donativo en especie directo al refugio, o apadrinas a un animal comprometiéndote a cubrir algo
              de su cuidado.
            </p>
            <div className="actions">
              <Link className="btn" href="/donar">Ver qué necesitan hoy</Link>
              <Link className="btn ghost" href="/animales?apadrinar=1">Apadrinar a un lomito</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
