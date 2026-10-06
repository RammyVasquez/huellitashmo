"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { fechaCorta } from "@/lib/util";
import { CATEGORIAS, type WelfarePublic } from "@/lib/types";
import PhotoStrip from "./PhotoStrip";

const ReportsMap = dynamic(() => import("./ReportsMap"), {
  ssr: false,
  loading: () => <div className="map-box" aria-hidden="true" />,
});

export default function RescueExplorer({ cases }: { cases: WelfarePublic[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const items = useMemo(
    () => cases.filter((c) => c.lat != null && c.lng != null).map((c) => ({
      id: c.id, kind: c.urgent ? "urgente" : "ayuda", lat: c.lat!, lng: c.lng!, label: `${CATEGORIAS[c.category].titulo} · ${c.species}`,
    })),
    [cases]
  );

  function pick(id: string) {
    setSelected(id);
    document.getElementById(`caso-${id}`)?.scrollIntoView({ block: "center" });
  }

  if (cases.length === 0)
    return <div className="empty">Por ahora no hay casos publicados. Gracias por estar al pendiente.</div>;

  return (
    <>
      {items.length > 0 && (
        <>
          <ReportsMap items={items} user={null} selectedId={selected} onSelect={pick} />
          <p className="legend">
            <span><i className="dot perdido" /> Urgente</span>
            <span><i className="dot encontrado" /> Necesita ayuda</span>
            <span className="muted">Ubicación aproximada</span>
          </p>
        </>
      )}
      <div className="grid reportes" style={{ marginTop: "1.2rem" }}>
        {cases.map((c) => (
          <article key={c.id} id={`caso-${c.id}`} className={`card${selected === c.id ? " selected" : ""}`}>
            <PhotoStrip photos={c.photos ?? []} alt={`${CATEGORIAS[c.category].titulo}`} />
            <div className="body">
              {c.urgent && <span className="tag alerta">urgente</span>}
              {c.status === "en_atencion" && <span className="tag ok">ya se está atendiendo</span>}
              <span className="tag">{CATEGORIAS[c.category].titulo}</span>
              <span className="tag">{c.species}</span>
              <p className="clamp">{c.description}</p>
              <small className="muted">{c.zone} · {fechaCorta(c.created_at)}</small>
              <div className="actions" style={{ marginBottom: 0 }}>
                {c.allow_contact && c.status === "activo" && <a className="btn" href={`/api/contacto-rescate/${c.id}`}>Quiero ayudar</a>}
                {c.lat != null && (
                  <button className="btn ghost" onClick={() => { setSelected(c.id); document.querySelector(".map-box")?.scrollIntoView({ block: "center" }); }}>
                    Ver en el mapa
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
