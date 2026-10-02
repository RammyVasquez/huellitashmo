"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Pos } from "@/lib/geo";

type Item = { id: string; kind: string; lat: number; lng: number; label: string };
type Props = {
  items: Item[];
  user: Pos | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPick?: (p: Pos) => void;
  picking?: boolean;
};

const HERMOSILLO: [number, number] = [29.0729, -110.9559];
const COLOR = { perdido: "#b8382b", encontrado: "#13284f" };
const pin = (kind: string, sel: boolean) =>
  L.divIcon({ className: "", html: `<div class="pin ${kind}${sel ? " sel" : ""}"></div>`, iconSize: [30, 30], iconAnchor: [15, 30] });

export default function ReportsMap({ items, user, selectedId, onSelect, onPick, picking }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef<Map<string, { mk: L.Marker; kind: string }>>(new Map());
  const userMarker = useRef<L.CircleMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false, dragging: !L.Browser.mobile }).setView(HERMOSILLO, 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => onPickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; layer.current = null; markers.current.clear(); userMarker.current = null; };
  }, []);

  useEffect(() => { el.current?.classList.toggle("picking", !!picking); }, [picking]);

  // Marcadores: los "encontrados" llevan un círculo porque su ubicación es aproximada
  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    markers.current.clear();
    items.forEach((it) => {
      if (it.kind === "encontrado") {
        L.circle([it.lat, it.lng], { radius: 800, color: COLOR.encontrado, weight: 2, dashArray: "6 6", fillOpacity: 0.08, interactive: false }).addTo(g);
      }
      const mk = L.marker([it.lat, it.lng], { icon: pin(it.kind, false), title: it.label, alt: it.label })
        .addTo(g)
        .bindTooltip(it.label)
        .on("click", () => onSelectRef.current(it.id));
      markers.current.set(it.id, { mk, kind: it.kind });
    });
  }, [items]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const pts: [number, number][] = items.map((i) => [i.lat, i.lng]);
    if (user) pts.push([user.lat, user.lng]);
    if (pts.length === 0) return;
    if (pts.length === 1) m.setView(pts[0], 14);
    else m.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
  }, [items, user]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    userMarker.current?.remove();
    userMarker.current = null;
    if (user) {
      userMarker.current = L.circleMarker([user.lat, user.lng], { radius: 8, color: "#ffffff", weight: 3, fillColor: "#1d3a73", fillOpacity: 1 })
        .addTo(m).bindTooltip("Tú estás aquí");
    }
  }, [user]);

  useEffect(() => {
    markers.current.forEach(({ mk, kind }, id) => mk.setIcon(pin(kind, id === selectedId)));
    const sel = selectedId ? markers.current.get(selectedId) : null;
    if (sel && map.current) map.current.panTo(sel.mk.getLatLng());
  }, [selectedId, items]);

  return <div ref={el} className="map-box" role="region" aria-label="Mapa de mascotas perdidas y encontradas" />;
}
