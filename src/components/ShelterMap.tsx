"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Point = { lat: number; lng: number };
type Props = {
  shelters: { id: string; name: string; lat: number; lng: number }[];
  user: Point | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const HERMOSILLO: [number, number] = [29.0729, -110.9559];
const pin = (active: boolean) =>
  L.divIcon({ className: "", html: `<div class="pin${active ? " active" : ""}"></div>`, iconSize: [30, 30], iconAnchor: [15, 30] });

export default function ShelterMap({ shelters, user, selectedId, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map());
  const userMarker = useRef<L.CircleMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false }).setView(HERMOSILLO, 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      markers.current.clear();
      userMarker.current = null;
    };
  }, []);

  // Marcadores de refugios
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current.clear();
    shelters.forEach((s) => {
      const mk = L.marker([s.lat, s.lng], { icon: pin(false), title: s.name, alt: s.name })
        .addTo(m)
        .bindTooltip(s.name)
        .on("click", () => onSelectRef.current(s.id));
      markers.current.set(s.id, mk);
    });
  }, [shelters]);

  // Encuadrar refugios (y al usuario si hay ubicación)
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const pts: [number, number][] = shelters.map((s) => [s.lat, s.lng]);
    if (user) pts.push([user.lat, user.lng]);
    if (pts.length === 0) return;
    if (pts.length === 1) m.setView(pts[0], 15);
    else m.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
  }, [shelters, user]);

  // Punto azul de "tú estás aquí"
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    userMarker.current?.remove();
    userMarker.current = null;
    if (user) {
      userMarker.current = L.circleMarker([user.lat, user.lng], {
        radius: 8, color: "#ffffff", weight: 3, fillColor: "#1d3a73", fillOpacity: 1,
      }).addTo(m).bindTooltip("Tú estás aquí");
    }
  }, [user]);

  // Resaltar el refugio elegido
  useEffect(() => {
    const m = map.current;
    markers.current.forEach((mk, id) => mk.setIcon(pin(id === selectedId)));
    if (m && selectedId) {
      const mk = markers.current.get(selectedId);
      if (mk) m.panTo(mk.getLatLng());
    }
  }, [selectedId, shelters]);

  return <div ref={el} className="map-box" role="region" aria-label="Mapa de refugios de Hermosillo" />;
}
