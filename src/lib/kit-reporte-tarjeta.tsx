// Imagen cuadrada (1080x1080) para compartir una mascota perdida o encontrada: cálida, con titular grande y foto protagonista.
import { Adornos, BarraInferior, DISPLAY, Etiquetas, FONDO, MarcoFoto, NAVY, type FotoKit } from "@/lib/kit-comun";

export type DatosReporte = {
  kind: "perdido" | "encontrado";
  especie: "perro" | "gato" | "otro";
  foto: FotoKit | null;
  zona: string;
  fecha: string;      // ej. "9 oct"
  qr: string | null;
};

export function TarjetaReporte({ d }: { d: DatosReporte }) {
  const perdido = d.kind === "perdido";
  const nombre = d.especie === "otro" ? "mascota" : d.especie;
  const titulo = perdido ? (d.especie === "otro" ? "¿La has visto?" : "¿Lo has visto?") : `¿Es tu ${nombre}?`;
  const tamTitulo = titulo.length <= 13 ? 128 : titulo.length <= 16 ? 108 : 90;
  const color = perdido ? "#e0523f" : "#1f9d6b";
  const zona = d.zona.length > 30 ? `${d.zona.slice(0, 29).trim()}…` : d.zona;
  const etiquetas = [d.especie === "otro" ? "Mascota" : d.especie.charAt(0).toUpperCase() + d.especie.slice(1), `${perdido ? "Desde el" : "Reportado el"} ${d.fecha}`];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: 1080, height: 1080, backgroundImage: FONDO, color: NAVY }}>
      <Adornos />
      <div style={{ display: "flex", marginTop: 46, fontSize: tamTitulo, lineHeight: 1, ...DISPLAY, color: NAVY }}>{titulo}</div>
      <div style={{ display: "flex", marginTop: 16, padding: "9px 30px", borderRadius: 44, background: color, color: "#ffffff", fontSize: 36, ...DISPLAY }}>
        {perdido ? "Se perdió en " : "Se encontró en "}{zona}
      </div>
      <MarcoFoto foto={d.foto} margen={30} />
      <div style={{ display: "flex", marginTop: 26 }}><Etiquetas lista={etiquetas} /></div>
      <BarraInferior cta={perdido ? "Si tienes información, entra aquí" : `Si es tu ${nombre}, entra aquí`} qr={d.qr} />
    </div>
  );
}
