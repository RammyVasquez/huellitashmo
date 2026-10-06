"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Shelter, ShelterNeed } from "@/lib/types";
import ShelterBadges from "./ShelterBadges";

const ShelterMap = dynamic(() => import("./ShelterMap"), {
  ssr: false,
  loading: () => <div className="map-box" aria-hidden="true" />,
});

type Pos = { lat: number; lng: number };

function km(a: Pos, b: Pos) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmt = (d: number) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);

function Logo({ s }: { s: Shelter }) {
  if (s.logo_url) return <img className="logo" src={s.logo_url} alt={`Logo de ${s.name}`} />;
  return <span className="logo fallback" aria-hidden="true">{s.name.trim().charAt(0).toUpperCase()}</span>;
}

function directionsUrl(s: Shelter) {
  if (s.lat != null && s.lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`;
  if (s.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address + ", Hermosillo, Sonora")}`;
  return null;
}

const ORDEN_MSG = "Ordenados del más cercano al más lejano, en línea recta.";

export default function DonarExplorer({ shelters, needs }: { shelters: Shelter[]; needs: ShelterNeed[] }) {
  const [user, setUser] = useState<Pos | null>(null);
  const [estado, setEstado] = useState<"idle" | "buscando" | "listo" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  function locate() {
    setPicking(false);
    if (!("geolocation" in navigator)) {
      setEstado("error");
      setMsg("Tu navegador no permite obtener la ubicación. Toca el mapa para marcar dónde estás.");
      setPicking(true);
      return;
    }
    setEstado("buscando");
    setMsg("Buscando tu ubicación… si tu navegador te pregunta, elige “Permitir”.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setUser({ lat: p.coords.latitude, lng: p.coords.longitude });
        setEstado("listo");
        setMsg(ORDEN_MSG);
      },
      (err) => {
        setEstado("error");
        setPicking(true);
        setMsg(
          err.code === 1
            ? "Tu navegador tiene bloqueado el permiso de ubicación para este sitio. Puedes activarlo (abajo te decimos cómo) o tocar el mapa para marcar dónde estás."
            : err.code === 3
            ? "Tardó demasiado en encontrarte. Intenta de nuevo o toca el mapa para marcar dónde estás."
            : "No pudimos determinar tu ubicación. Revisa que la ubicación del teléfono esté activada o toca el mapa para marcar dónde estás."
        );
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }

  function marcarEnMapa() {
    setPicking(true);
    setEstado("idle");
    setMsg("Toca el mapa en el lugar donde estás.");
    document.querySelector(".map-box")?.scrollIntoView({ block: "center" });
  }

  function onPick(p: Pos) {
    setUser(p);
    setEstado("listo");
    setPicking(false);
    setMsg(`Ubicación marcada en el mapa. ${ORDEN_MSG}`);
  }

  const withCoords = useMemo(
    () => shelters.filter((s) => s.lat != null && s.lng != null).map((s) => ({ id: s.id, name: s.name, lat: s.lat!, lng: s.lng! })),
    [shelters]
  );

  const ordered = useMemo(() => {
    const dist = new Map<string, number>();
    if (user) shelters.forEach((s) => { if (s.lat != null && s.lng != null) dist.set(s.id, km(user, { lat: s.lat, lng: s.lng })); });
    const list = [...shelters].sort((a, b) => {
      if (!user) return a.name.localeCompare(b.name, "es");
      const da = dist.get(a.id), db = dist.get(b.id);
      if (da == null && db == null) return a.name.localeCompare(b.name, "es");
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
    return { list, dist };
  }, [shelters, user]);

  function pick(id: string) {
    setSelected(id);
    document.getElementById(`refugio-${id}`)?.scrollIntoView({ block: "center" });
  }

  return (
    <>
      <div className="locate">
        <button className="btn" onClick={locate} disabled={estado === "buscando"}>
          {estado === "listo" ? "Actualizar mi ubicación" : "Ver el refugio más cercano a mí"}
        </button>
        <button className="btn ghost" onClick={marcarEnMapa}>Marcar mi ubicación en el mapa</button>
        <p className="muted" role="status" aria-live="polite" style={{ margin: 0, flexBasis: "100%" }}>
          {msg || "Tu ubicación se usa solo en tu navegador para calcular distancias: no se guarda ni se envía."}
        </p>
      </div>

      {estado === "error" && (
        <details className="help box">
          <summary>¿Cómo activo la ubicación?</summary>
          <ul>
            <li><b>iPhone:</b> Ajustes → Privacidad y seguridad → Localización → activa “Localización” y en Safari (Sitios web) elige “Al usar la app”. Luego, en Safari, toca “aA” junto a la dirección → Ajustes del sitio web → Ubicación → “Preguntar” o “Permitir”.</li>
            <li><b>Android (Chrome):</b> toca el ícono junto a la dirección → Permisos → Ubicación → “Permitir”.</li>
            <li>Si abriste esta liga desde Facebook, Instagram o WhatsApp, ábrela en Safari o Chrome: los navegadores dentro de esas apps suelen bloquear la ubicación.</li>
          </ul>
        </details>
      )}

      {withCoords.length > 0 ? (
        <ShelterMap shelters={withCoords} user={user} selectedId={selected} onSelect={pick} onPick={picking ? onPick : undefined} picking={picking} />
      ) : (
        <div className="empty">Los refugios aún no tienen ubicación en el mapa.</div>
      )}

      <div className="shelter-grid">
        {ordered.list.map((s, i) => {
          const mine = needs.filter((n) => n.shelter_id === s.id);
          const d = ordered.dist.get(s.id);
          const nearest = !!user && i === 0 && d != null;
          const dir = directionsUrl(s);
          const wa = s.whatsapp
            ? `https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Hola, quiero hacer un donativo en especie (vi su lista en Huellitas HMO). ¿Cuándo puedo llevarlo?")}`
            : null;
          return (
            <article key={s.id} id={`refugio-${s.id}`} className={`shelter-card${selected === s.id ? " selected" : ""}`}>
              <div className="shelter-head">
                <Logo s={s} />
                <div>
                  <h2>{s.name}</h2>
                  <div>
                    <ShelterBadges kind={s.kind} verifiedAt={s.verified_at} />
                    {nearest && <span className="tag urgente">El más cercano</span>}
                    {d != null && <span className="tag">a {fmt(d)}</span>}
                  </div>
                </div>
              </div>

              {s.about && <p>{s.about}</p>}

              {(s.address || s.drop_off_hours) && (
                <div className="box">
                  {s.address && <p style={{ margin: 0 }}><b>Dónde entregar:</b> {s.address}</p>}
                  {s.drop_off_hours && <p style={{ margin: 0 }}><b>Horario:</b> {s.drop_off_hours}</p>}
                </div>
              )}

              <h3>Lo que necesitan</h3>
              {mine.length === 0 ? (
                <p className="muted">Sin lista publicada. Escríbeles para preguntar qué les hace falta.</p>
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

              <div className="actions">
                {wa && <a className="btn alt" href={wa}>Coordinar mi donativo</a>}
                {dir && <a className="btn ghost" href={dir} target="_blank" rel="noopener noreferrer">Cómo llegar</a>}
                <a className="btn ghost" href={`/refugios/${s.id}`}>Ver perfil</a>
                {s.lat != null && <button className="btn ghost" onClick={() => { setSelected(s.id); document.querySelector(".map-box")?.scrollIntoView({ block: "center" }); }}>Ver en el mapa</button>}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
