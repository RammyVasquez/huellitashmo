import Link from "next/link";
import ShelterBadges from "@/components/ShelterBadges";
import { supabase } from "@/lib/supabase";
import type { Shelter } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Refugios · Huellitas HMO" };

export default async function Refugios() {
  const { data } = await supabase.from("shelters").select("*").order("name");
  const shelters = (data ?? []) as Shelter[];
  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Los refugios de Hermosillo</h1>
      <p className="lead">Personas que rescatan todos los días. Conócelos, sigue su trabajo y ayúdalos.</p>
      <p className="muted">¿Cuidas animales en Hermosillo, con o sin refugio? <Link href="/nosotros#sumarte">Súmate a Huellitas HMO</Link>.</p>
      {shelters.length === 0 ? (
        <div className="empty">Pronto estarán aquí los refugios aliados.</div>
      ) : (
        <div className="shelter-grid">
          {shelters.map((s) => (
            <Link key={s.id} href={`/refugios/${s.id}`} className="shelter-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="shelter-head">
                {s.logo_url ? <img className="logo" src={s.logo_url} alt="" /> : <span className="logo fallback" aria-hidden="true">{s.name.trim().charAt(0).toUpperCase()}</span>}
                <div><h2>{s.name}</h2><ShelterBadges kind={s.kind} verifiedAt={s.verified_at} /></div>
              </div>
              {s.about && <p>{s.about}</p>}
              <span className="btn ghost">Conocer al refugio</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
