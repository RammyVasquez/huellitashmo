"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { buscarLugar, reverso, type Lugar } from "@/lib/geocode";
import type { Pos } from "@/lib/geo";
import type { Focus } from "./LocationPicker";
import LocationHelp from "./LocationHelp";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <div className="map-box small" aria-hidden="true" />,
});

// Dirección + ubicación: escribe una calle o colonia, usa el GPS del teléfono, o toca el mapa
export default function ZonePicker({ zona, onZona, loc, onLoc, label = "Calle, colonia o referencia", nota }: {
  zona: string; onZona: (v: string) => void; loc: Pos | null; onLoc: (p: Pos | null) => void; label?: string; nota?: React.ReactNode;
}) {
  const [focus, setFocus] = useState<Focus | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [gps, setGps] = useState(false);
  const [aviso, setAviso] = useState("");
  const [ultima, setUltima] = useState("");
  const [opciones, setOpciones] = useState<Lugar[]>([]);
  const [precision, setPrecision] = useState<number | null>(null);
  const [ayuda, setAyuda] = useState(false);

  const zonaRef = useRef(zona); zonaRef.current = zona;
  const locRef = useRef(loc); locRef.current = loc;
  const autoTexto = useRef(false); // el texto lo escribió el GPS: se puede reemplazar sin preguntar

  function colocar(p: Pos, zoom: number) {
    onLoc({ lat: p.lat, lng: p.lng });
    setPrecision(null);
    setFocus({ lat: p.lat, lng: p.lng, zoom, n: Date.now() });
  }

  async function buscar() {
    const texto = zona.trim();
    if (texto.length < 3) return;
    const antes = locRef.current;
    setBuscando(true);
    setAviso("");
    setOpciones([]);
    setAyuda(false);
    setUltima(texto);
    const r = await buscarLugar(texto);
    setBuscando(false);
    if (locRef.current && locRef.current !== antes) return; // la persona ya marcó un punto mientras buscábamos
    if (r.error) { setAviso("No pudimos buscar ahora. Usa tu ubicación o toca el mapa."); return; }
    if (!r.lugares.length) {
      setAviso("No encontramos esa dirección. Prueba con calle y colonia (ej. Blvd. Kino, Colonia Pitic), escribe dos calles (“Reforma y Kino”), usa tu ubicación o toca el mapa.");
      return;
    }
    colocar(r.lugares[0], r.esquina ? 17 : 16);
    setOpciones(r.lugares.slice(1));
    setAviso(
      r.esquina ? "Encontramos el cruce. Revisa el pin y ajústalo si hace falta."
      : r.lugares.length > 1 ? "Marcamos la primera coincidencia. Si no es, elige otra abajo o toca el mapa."
      : "Marcamos la dirección de forma aproximada. Arrastra el pin o toca el mapa para ajustarlo."
    );
  }

  function usarGps() {
    setAyuda(false);
    setOpciones([]);
    if (!("geolocation" in navigator)) { setAviso("Tu navegador no permite obtener la ubicación. Escribe la dirección o toca el mapa."); return; }
    setGps(true);
    setAviso("Buscando tu ubicación… si el navegador pregunta, elige “Permitir”.");
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        const acc = Math.round(p.coords.accuracy);
        onLoc(pos);
        setPrecision(acc);
        setFocus({ ...pos, zoom: acc <= 60 ? 18 : acc <= 200 ? 17 : 15, n: Date.now() });
        setGps(false);
        const nombre = await reverso(pos);
        if (nombre && (!zonaRef.current.trim() || autoTexto.current)) { onZona(nombre); autoTexto.current = true; }
        const base = acc > 100
          ? `La precisión es baja (±${acc} m). Mueve el pin al lugar correcto.`
          : "Marcamos tu ubicación actual. Revisa que el pin esté bien.";
        setAviso(nombre ? `${base} Detectamos: ${nombre}.` : base);
      },
      (err) => {
        setGps(false);
        setAyuda(err.code === 1);
        setAviso(
          err.code === 1 ? "El navegador tiene bloqueado el permiso de ubicación. Actívalo (abajo te decimos cómo), escribe la dirección o toca el mapa."
          : err.code === 3 ? "Tardó demasiado en encontrarte. Intenta de nuevo, escribe la dirección o toca el mapa."
          : "No pudimos determinar tu ubicación. Revisa que la ubicación del teléfono esté activada, escribe la dirección o toca el mapa."
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  return (
    <>
      <label>{label}
        <div className="row">
          <input
            value={zona}
            onChange={(e) => { autoTexto.current = false; onZona(e.target.value); }}
            onBlur={(e) => {
              const aBoton = e.relatedTarget instanceof HTMLElement && e.relatedTarget.closest(".zona-acciones");
              if (!aBoton && !loc && zona.trim().length > 2 && zona.trim() !== ultima) buscar();
            }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscar(); } }}
            placeholder="Ej. Blvd. Kino y Reforma, o Colonia Pitic"
            required
          />
        </div>
      </label>
      <div className="actions zona-acciones" style={{ margin: 0 }}>
        <button type="button" className="btn" onClick={usarGps} disabled={gps}>{gps ? "Buscando…" : "Usar mi ubicación actual"}</button>
        <button type="button" className="btn ghost" onClick={buscar} disabled={buscando || zona.trim().length < 3}>{buscando ? "Buscando…" : "Buscar en el mapa"}</button>
      </div>
      {aviso && <p className="muted" role="status" aria-live="polite" style={{ margin: 0 }}>{aviso}</p>}
      {ayuda && <LocationHelp />}
      {opciones.length > 0 && (
        <div role="group" aria-label="Otras coincidencias">
          <p className="muted" style={{ margin: "0 0 .4rem", fontSize: ".95rem" }}>¿Es alguna de estas?</p>
          <div className="sugerencias">
            {opciones.map((o) => (
              <button type="button" key={`${o.label}${o.lat}`} onClick={() => { colocar(o, 16); setOpciones([]); setAviso(`Marcamos: ${o.label}. Ajusta el pin si hace falta.`); }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {nota && <p className="muted" style={{ margin: 0, fontSize: ".95rem" }}>{nota}</p>}
      <LocationPicker value={loc} onChange={(p) => { setPrecision(null); onLoc(p); }} focus={focus} accuracy={precision} />
    </>
  );
}
