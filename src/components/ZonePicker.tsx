"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Pos } from "@/lib/geo";
import type { Focus } from "./LocationPicker";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <div className="map-box small" aria-hidden="true" />,
});

// Colonia + búsqueda en el mapa (OpenStreetMap) + pin que se puede ajustar
export default function ZonePicker({ zona, onZona, loc, onLoc, label = "Colonia o zona", nota }: {
  zona: string; onZona: (v: string) => void; loc: Pos | null; onLoc: (p: Pos | null) => void; label?: string; nota?: React.ReactNode;
}) {
  const [focus, setFocus] = useState<Focus | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [ultima, setUltima] = useState("");

  async function buscar() {
    const texto = zona.trim();
    if (texto.length < 3) return;
    setBuscando(true);
    setAviso("");
    setUltima(texto);
    try {
      const params = new URLSearchParams({
        q: `${texto}, Hermosillo, Sonora, México`, format: "jsonv2", limit: "1", countrycodes: "mx",
        viewbox: "-111.2,29.3,-110.7,28.9", "accept-language": "es",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
      const data = (await res.json()) as { lat: string; lon: string }[];
      const lat = parseFloat(data[0]?.lat), lng = parseFloat(data[0]?.lon);
      const dentro = lat > 28.7 && lat < 29.5 && lng > -111.4 && lng < -110.6;
      if (!data.length || Number.isNaN(lat) || !dentro) {
        setAviso("No encontramos esa zona en el mapa. Toca el mapa para marcar el lugar.");
      } else {
        onLoc({ lat, lng });
        setFocus({ lat, lng, zoom: 15, n: Date.now() });
        setAviso("Marcamos la zona de forma aproximada. Arrastra el pin o toca el mapa para ajustarlo.");
      }
    } catch {
      setAviso("No pudimos buscar la zona ahora. Toca el mapa para marcar el lugar.");
    }
    setBuscando(false);
  }

  return (
    <>
      <label>{label}
        <div className="row">
          <input
            value={zona}
            onChange={(e) => onZona(e.target.value)}
            onBlur={() => { if (!loc && zona.trim().length > 2 && zona.trim() !== ultima) buscar(); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscar(); } }}
            placeholder="Ej. Colonia Pitic, bulevar Kino"
            required
          />
          <button type="button" className="btn ghost" onClick={buscar} disabled={buscando || zona.trim().length < 3}>
            {buscando ? "Buscando…" : "Buscar en el mapa"}
          </button>
        </div>
      </label>
      {aviso && <p className="muted" role="status" style={{ margin: "-.4rem 0 .2rem" }}>{aviso}</p>}
      {nota && <p className="muted" style={{ margin: 0, fontSize: ".95rem" }}>{nota}</p>}
      <LocationPicker value={loc} onChange={onLoc} focus={focus} />
    </>
  );
}
