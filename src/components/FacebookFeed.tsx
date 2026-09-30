"use client";
import { useState } from "react";

// No carga nada de Facebook hasta que la persona lo pide (evita rastrearla sin que lo decida).
export default function FacebookFeed({ pageUrl, name }: { pageUrl: string; name: string }) {
  const [abierto, setAbierto] = useState(false);
  const src =
    "https://www.facebook.com/plugins/page.php?href=" + encodeURIComponent(pageUrl) +
    "&tabs=timeline&width=500&height=640&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false";

  if (!abierto)
    return (
      <div className="box">
        <p style={{ marginTop: 0 }}>Mira las publicaciones más recientes de {name} en Facebook.</p>
        <button className="btn ghost" onClick={() => setAbierto(true)}>Ver sus publicaciones</button>
        <p className="muted" style={{ margin: ".7rem 0 0", fontSize: ".9rem" }}>
          Al abrirlas, Facebook puede registrar tu visita.
        </p>
      </div>
    );

  return (
    <div>
      <iframe
        title={`Publicaciones de ${name} en Facebook`}
        src={src}
        width="500"
        height="640"
        style={{ border: 0, maxWidth: "100%", overflow: "hidden" }}
        loading="lazy"
        allow="encrypted-media"
      />
      <p className="muted" style={{ fontSize: ".9rem" }}>
        ¿No se ve? La página debe ser pública. <a href={pageUrl} target="_blank" rel="noopener noreferrer">Ábrela en Facebook</a>.
      </p>
    </div>
  );
}
