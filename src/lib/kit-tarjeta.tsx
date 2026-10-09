// Imagen cuadrada (1080x1080) para compartir a un animal en adopción: cálida, con su nombre grande y su foto como protagonista.
import { Adornos, BarraInferior, DISPLAY, Etiquetas, FONDO, MarcoFoto, NAVY, type FotoKit } from "@/lib/kit-comun";

export type { FotoKit };
export type DatosKit = {
  nombre: string;
  foto: FotoKit | null;
  etiquetas: string[];
  refugio: string | null;
  estado: "disponible" | "en_cuidados" | "adoptado";
  cta: string;           // ej. "Adóptala"
  qr: string | null;     // data URI del código QR hacia la ficha
};

function Pastilla({ estado }: { estado: DatosKit["estado"] }) {
  const fondo = estado === "adoptado" ? "#1f9d6b" : estado === "en_cuidados" ? "#3f7de0" : NAVY;
  const texto = estado === "adoptado" ? "¡Ya tiene hogar!" : estado === "en_cuidados" ? "Se está recuperando" : "Busca hogar";
  return <div style={{ display: "flex", padding: "8px 32px", borderRadius: 44, background: fondo, color: "#ffffff", fontSize: 34, ...DISPLAY }}>{texto}</div>;
}

function tamNombre(nombre: string) {
  return Math.max(56, Math.min(140, Math.floor(968 / (Math.max(nombre.length, 1) * 0.62))));
}

export function TarjetaKit({ d }: { d: DatosKit }) {
  const nombre = d.nombre.length > 30 ? `${d.nombre.slice(0, 29).trim()}…` : d.nombre;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: 1080, height: 1080, backgroundImage: FONDO, color: NAVY }}>
      <Adornos />
      <div style={{ display: "flex", marginTop: 36 }}><Pastilla estado={d.estado} /></div>
      <div style={{ display: "flex", marginTop: 10, fontSize: tamNombre(nombre), lineHeight: 1, ...DISPLAY, color: NAVY }}>{nombre}</div>
      <MarcoFoto foto={d.foto} margen={24} />
      <div style={{ display: "flex", marginTop: 24 }}><Etiquetas lista={d.etiquetas.slice(0, 4)} /></div>
      <BarraInferior cta={d.cta} extra={d.refugio} qr={d.qr} />
    </div>
  );
}
