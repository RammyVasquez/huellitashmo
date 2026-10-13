// Imagen vertical (1080x1350) para compartir una mascota perdida o encontrada: foto a toda la imagen, titular grande y datos encima.
import { ALTO, ANCHO, Banner, BarraInferior, DISPLAY, Ficha, FotoCompleta, NAVY, type FotoKit } from "@/lib/kit-comun";

export type DatosReporte = {
  kind: "perdido" | "encontrado";
  especie: "perro" | "gato" | "otro";
  foto: FotoKit | null;
  zona: string;
  fecha: string;      // ej. "9 oct"
  qr: string | null;
};

export function tituloImagen(kind: "perdido" | "encontrado", especie: "perro" | "gato" | "otro") {
  const nombre = especie === "otro" ? "mascota" : especie;
  return kind === "perdido" ? (especie === "otro" ? "¿LA HAS VISTO?" : "¿LO HAS VISTO?") : `¿ES TU ${nombre.toUpperCase()}?`;
}

export function TarjetaReporte({ d }: { d: DatosReporte }) {
  const perdido = d.kind === "perdido";
  const nombre = d.especie === "otro" ? "mascota" : d.especie;
  const titulo = tituloImagen(d.kind, d.especie);
  const color = perdido ? "#e0523f" : "#1f9d6b";
  const zona = d.zona.length > 30 ? `${d.zona.slice(0, 29).trim()}…` : d.zona;
  const especieTxt = d.especie === "otro" ? "Mascota" : d.especie.charAt(0).toUpperCase() + d.especie.slice(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", position: "relative", width: ANCHO, height: ALTO, background: NAVY }}>
      <FotoCompleta foto={d.foto} />
      <Banner texto={titulo} color={NAVY} tam={titulo.length <= 14 ? 66 : 54} />
      <div style={{ display: "flex", justifyContent: "center", width: ANCHO, marginTop: 18 }}>
        <div style={{ display: "flex", padding: "9px 32px", borderRadius: 44, background: color, color: "#ffffff", fontSize: 38, boxShadow: "0 10px 24px rgba(0,0,0,0.30)", ...DISPLAY }}>
          {perdido ? "Se perdió en " : "Se encontró en "}{zona}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", position: "absolute", left: 40, bottom: 204, width: 1000 }}>
        <div style={{ display: "flex", marginRight: 24 }}><Ficha titulo="ESPECIE" valor={especieTxt} ancho={300} /></div>
        <Ficha titulo={perdido ? "SE PERDIÓ EL" : "REPORTADO EL"} valor={d.fecha} ancho={380} />
      </div>
      <BarraInferior cta={perdido ? "Si tienes información, entra aquí" : `Si es tu ${nombre}, entra aquí`} qr={d.qr} />
    </div>
  );
}
