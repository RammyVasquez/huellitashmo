"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { coincide } from "@/lib/buscar";
import { fmtKm, km } from "@/lib/geo";
import { useLocation } from "@/lib/useLocation";
import { fechaCorta } from "@/lib/util";
import LocationHelp from "./LocationHelp";
import PhotoStrip from "./PhotoStrip";
import type { PublicReport } from "@/lib/types";

const ReportsMap = dynamic(() => import("./ReportsMap"), {
  ssr: false,
  loading: () => <div className="map-box" aria-hidden="true" />,
});

type Tipo = "todos" | "perdido" | "encontrado";
type Especie = "todas" | "perro" | "gato";

export default function ReportsExplorer({ reports }: { reports: PublicReport[] }) {
  const [tipo, setTipo] = useState<Tipo>("todos");
  const [especie, setEspecie] = useState<Especie>("todas");
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const loc = useLocation("Ordenados del más cercano al más lejano.");

  const filtrados = useMemo(
    () => reports.filter((r) =>
      (tipo === "todos" || r.kind === tipo) &&
      (especie === "todas" || r.species === especie) &&
      coincide(q, `${r.kind} ${r.species} ${r.zone ?? ""} ${r.description}`)),
    [reports, tipo, especie, q]
  );

  const { lista, dist } = useMemo(() => {
    const dist = new Map<string, number>();
    if (loc.pos) filtrados.forEach((r) => { if (r.lat != null && r.lng != null) dist.set(r.id, km(loc.pos!, { lat: r.lat, lng: r.lng })); });
    const lista = loc.pos
      ? [...filtrados].sort((a, b) => (dist.get(a.id) ?? Infinity) - (dist.get(b.id) ?? Infinity))
      : filtrados;
    return { lista, dist };
  }, [filtrados, loc.pos]);

  const items = useMemo(
    () => filtrados.filter((r) => r.lat != null && r.lng != null).map((r) => ({
      id: r.id, kind: r.kind, lat: r.lat!, lng: r.lng!, label: `${r.kind === "perdido" ? "Perdido" : "Encontrado"} · ${r.species}`,
    })),
    [filtrados]
  );

  function pick(id: string) {
    setSelected(id);
    document.getElementById(`reporte-${id}`)?.scrollIntoView({ block: "center" });
  }

  const Chip = ({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" aria-pressed={activo} onClick={onClick}>{children}</button>
  );

  return (
    <>
      <label className="buscador">Buscar por descripción, color, colonia o seña
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. café con collar rojo, Portales, “Simón”" />
      </label>
      <div className="chips" role="group" aria-label="Filtrar por tipo">
        <Chip activo={tipo === "todos"} onClick={() => setTipo("todos")}>Todos</Chip>
        <Chip activo={tipo === "perdido"} onClick={() => setTipo("perdido")}>Perdidos</Chip>
        <Chip activo={tipo === "encontrado"} onClick={() => setTipo("encontrado")}>Encontrados</Chip>
      </div>
      <div className="chips" role="group" aria-label="Filtrar por especie">
        <Chip activo={especie === "todas"} onClick={() => setEspecie("todas")}>Todas</Chip>
        <Chip activo={especie === "perro"} onClick={() => setEspecie("perro")}>Perros</Chip>
        <Chip activo={especie === "gato"} onClick={() => setEspecie("gato")}>Gatos</Chip>
      </div>

      <div className="locate">
        <button className="btn" onClick={loc.locate} disabled={loc.estado === "buscando"}>
          {loc.estado === "listo" ? "Actualizar mi ubicación" : "Ver los más cercanos a mí"}
        </button>
        <button className="btn ghost" onClick={loc.startPicking}>Marcar mi ubicación en el mapa</button>
        <p className="muted" role="status" aria-live="polite" style={{ margin: 0, flexBasis: "100%" }}>
          {loc.msg || "Tu ubicación se usa solo en tu navegador para calcular distancias: no se guarda ni se envía."}
        </p>
      </div>
      {loc.estado === "error" && <LocationHelp />}

      {items.length > 0 ? (
        <>
          <ReportsMap items={items} user={loc.pos} selectedId={selected} onSelect={pick} onPick={loc.picking ? loc.onPick : undefined} picking={loc.picking} />
          <p className="legend">
            <span><i className="dot perdido" /> Perdido</span>
            <span><i className="dot encontrado" /> Encontrado (zona aproximada)</span>
          </p>
        </>
      ) : (
        <div className="empty">Ningún reporte con ubicación en el mapa por ahora.</div>
      )}

      {(q.trim() || tipo !== "todos" || especie !== "todas") && (
        <p className="muted" role="status" style={{ margin: "1rem 0 0" }}>
          Mostrando {lista.length} de {reports.length} reportes.{" "}
          {q.trim() && <button type="button" className="link" onClick={() => setQ("")}>Limpiar búsqueda</button>}
        </p>
      )}

      {lista.length === 0 ? (
        <div className="empty" style={{ marginTop: "1rem" }}>No hay reportes activos con estos filtros. Si viste o perdiste una mascota, cuéntanos.</div>
      ) : (
        <div className="grid reportes" style={{ marginTop: "1.2rem" }}>
          {lista.map((r) => {
            const d = dist.get(r.id);
            return (
              <article key={r.id} id={`reporte-${r.id}`} className={`card${selected === r.id ? " selected" : ""}`}>
                <PhotoStrip photos={r.photos?.length ? r.photos : r.photo_url ? [r.photo_url] : []} alt={`Mascota ${r.kind}`} />
                <div className="body">
                  <span className={`tag ${r.kind}`}>{r.kind}</span>
                  <span className="tag">{r.species}</span>
                  {d != null && <span className="tag">{r.kind === "encontrado" ? "≈ " : ""}a {fmtKm(d)}</span>}
                  <p>{r.description}</p>
                  <small className="muted">{r.zone} · {fechaCorta(r.created_at)}</small>
                  <div className="actions" style={{ marginBottom: 0 }}>
                    <a className="btn" href={`/api/contacto/${r.id}`}>Contactar por WhatsApp</a>
                    {r.lat != null && (
                      <button className="btn ghost" onClick={() => { setSelected(r.id); document.querySelector(".map-box")?.scrollIntoView({ block: "center" }); }}>
                        Ver en el mapa
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p style={{ marginTop: "1.6rem" }}><Link className="btn alt" href="/reportes/nuevo">Reportar una mascota</Link></p>
    </>
  );
}
