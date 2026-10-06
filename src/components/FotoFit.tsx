import type { CSSProperties } from "react";

// Muestra la foto COMPLETA (sin recortar) sobre un fondo con la misma foto desenfocada, para que todas las tarjetas queden parejas.
export default function FotoFit({ src, alt, className = "", eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  const fondo = `url("${src.replace(/["\\()\s]/g, (c) => encodeURIComponent(c))}")`;
  return (
    <div className={`foto-fit ${className}`.trim()} style={{ "--bg": fondo } as CSSProperties}>
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} />
    </div>
  );
}
