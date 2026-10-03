"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Pos } from "@/lib/geo";

const HERMOSILLO: [number, number] = [29.0729, -110.9559];
const icon = L.divIcon({ className: "", html: '<div class="pin"></div>', iconSize: [30, 30], iconAnchor: [15, 30] });

export type Focus = { lat: number; lng: number; zoom: number; n: number };

export default function LocationPicker({ value, onChange, focus, accuracy }: {
  value: Pos | null; onChange: (p: Pos | null) => void; focus?: Focus | null; accuracy?: number | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const circle = useRef<L.Circle | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false }).setView(HERMOSILLO, 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }));
    map.current = m;
    return () => { m.remove(); map.current = null; marker.current = null; circle.current = null; };
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

  // Círculo con la precisión del GPS
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    circle.current?.remove();
    circle.current = null;
    if (value && accuracy && accuracy > 15) {
      circle.current = L.circle([value.lat, value.lng], { radius: accuracy, color: "#1d3a73", weight: 1, fillOpacity: 0.1, interactive: false }).addTo(m);
    }
  }, [value, accuracy]);

  useEffect(() => {
    if (focus) map.current?.setView([focus.lat, focus.lng], focus.zoom);
  }, [focus]);

  return (
    <div>
      <div ref={el} className="map-box small" role="region" aria-label="Mapa para marcar la ubicación" />
      <p className="muted" role="status" style={{ margin: ".5rem 0 0", fontSize: ".92rem" }}>
        {value ? "Ubicación marcada. Arrastra el pin o toca el mapa para ajustarla." : "Toca el mapa para marcar el lugar."}
        {value && <> <button type="button" className="link" onClick={() => onChange(null)}>Quitar ubicación</button></>}
      </p>
    </div>
  );
}
