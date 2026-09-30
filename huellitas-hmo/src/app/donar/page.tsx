import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Shelter, ShelterNeed } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dona en especie · Huellitas HMO" };

export default async function Donar() {
  const [{ data: sh }, { data: nd }] = await Promise.all([
    supabase.from("shelters").select("*").order("name"),
    supabase.from("shelter_needs").select("*").eq("fulfilled", false).order("urgent", { ascending: false }),
  ]);
  const shelters = (sh ?? []) as Shelter[];
  const needs = (nd ?? []) as ShelterNeed[];

  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Dona en especie</h1>
      <p className="lead">
        Aquí no pedimos dinero. Esta plataforma no recibe ni maneja pagos: tú entregas el donativo
        directamente al refugio y ellos lo usan para sus animales.
      </p>

      {shelters.length === 0 ? (
        <div className="empty">Aún no hay refugios registrados con necesidades. Vuelve pronto.</div>
      ) : (
        shelters.map((s) => {
          const mine = needs.filter((n) => n.shelter_id === s.id);
          const wa = s.whatsapp
            ? `https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Hola, quiero hacer un donativo en especie (vi su lista en Huellitas HMO). ¿Cuándo puedo llevarlo?")}`
            : null;
          return (
            <section className="section" key={s.id}>
              <h2>{s.name}</h2>
              {(s.address || s.drop_off_hours) && (
                <div className="box">
                  {s.address && <p style={{ margin: 0 }}><b>Dónde entregar:</b> {s.address}</p>}
                  {s.drop_off_hours && <p style={{ margin: 0 }}><b>Horario:</b> {s.drop_off_hours}</p>}
                </div>
              )}
              {mine.length === 0 ? (
                <p className="muted">Por ahora no tienen una lista publicada. Escríbeles para preguntar qué les hace falta.</p>
              ) : (
                <ul>
                  {mine.map((n) => (
                    <li key={n.id}>
                      <b>{n.item}</b> {n.urgent && <span className="tag urgente">urgente</span>}
                      {n.detail && <span className="muted"> · {n.detail}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {wa && <p><a className="btn alt" href={wa}>Coordinar mi donativo</a></p>}
            </section>
          );
        })
      )}

      <section className="section">
        <div className="band">
          <h3>¿Prefieres ayudar a un animal en particular?</h3>
          <p>Apadrina a un lomito: te comprometes a cubrir en especie algo de su cuidado, como su comida del mes.</p>
          <Link className="btn" href="/animales?apadrinar=1">Ver animales para apadrinar</Link>
        </div>
      </section>
    </div>
  );
}
