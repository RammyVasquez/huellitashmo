"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Pos } from "@/lib/geo";

const HERMOSILLO: [number, number] = [29.0729, -110.9559];
const icon = L.divIcon({ className: "", html: '<div class="pin"></div>', iconSize: [30, 30], iconAnchor: [15, 30] });

export type Focus = { lat: number; lng: number; zoom: number; n: number };

export default function LocationPicker({ value, onChange, focus }: { value: Pos | null; onChange: (p: Pos | null) => void; focus?: Focus | null }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false }).setView(HERMOSILLO, 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }));
    map.current = m;
    return () => { m.remove(); map.current = null; marker.current = null; };
  }, []);

  // El marcador siempre refleja el valor del formulario
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!value) { marker.current?.remove(); marker.current = null; return; }
    if (!marker.current) {
      marker.current = L.marker([value.lat, value.lng], { icon, draggable: true, alt: "Ubicación elegida" }).addTo(m);
      marker.current.on("dragend", () => {
        const p = marker.current!.getLatLng();
        onChangeRef.current({ lat: p.lat, lng: p.lng });
      });
    } else {
      marker.current.setLatLng([value.lat, value.lng]);
    }
  }, [value]);

  // Mover el mapa cuando se busca una colonia
  useEffect(() => {
    if (focus) map.current?.setView([focus.lat, focus.lng], focus.zoom);
  }, [focus]);

  function usarMiUbicacion() {
    setAviso("");
    if (!("geolocation" in navigator)) { setAviso("Tu navegador no permite obtener la ubicación. Toca el mapa para marcarla."); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        onChange(pos);
        map.current?.setView([pos.lat, pos.lng], 16);
      },
      () => setAviso("No pudimos obtener tu ubicación. Toca el mapa para marcarla."),
      { timeout: 15000 }
    );
  }

  return (
    <div>
      <div className="actions" style={{ margin: "0 0 .6rem" }}>
        <button type="button" className="btn ghost" onClick={usarMiUbicacion}>Usar mi ubicación actual</button>
        {value && <button type="button" className="btn ghost" onClick={() => onChange(null)}>Quitar ubicación</button>}
      </div>
      <div ref={el} className="map-box small" role="region" aria-label="Mapa para marcar la ubicación" />
      <p className="muted" role="status" style={{ margin: ".5rem 0 0", fontSize: ".92rem" }}>
        {aviso || (value ? "Ubicación marcada. Puedes arrastrar el pin para ajustarla." : "Toca el mapa donde la viste o donde se perdió.")}
      </p>
    </div>
  );
}
