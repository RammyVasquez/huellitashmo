// Imagen cuadrada (1080x1080) para compartir una mascota perdida o encontrada: cálida, con titular grande y foto protagonista.
import type { FotoKit } from "@/lib/kit-tarjeta";

export type DatosReporte = {
  kind: "perdido" | "encontrado";
  especie: "perro" | "gato" | "otro";
  foto: FotoKit | null;
  zona: string;
  fecha: string;      // ej. "9 oct"
  qr: string | null;
};

const NAVY = "#13284f";
const SOL = "#ffc933";
const FONDO = "linear-gradient(165deg, #ffe08a 0%, #ffc933 48%, #ffb41f 100%)";
const DISPLAY = { fontFamily: "Fredoka", fontWeight: 600 } as const;

function Huella({ s, color, left, top, rot = 0 }: { s: number; color: string; left?: number; top?: number; rot?: number }) {
  const caja = (l: number, t: number, w: number, h: number, r: number) => (
    <div style={{ display: "flex", position: "absolute", left: l * s, top: t * s, width: w * s, height: h * s, borderRadius: r * s, background: color }} />
  );
  const base = { display: "flex", position: "relative" as const, width: s, height: s, transform: `rotate(${rot}deg)` };
  const caja2 = (
    <div style={left !== undefined ? { ...base, position: "absolute", left, top } : base}>
      {caja(0.2, 0.54, 0.6, 0.4, 0.22)}{caja(0, 0.38, 0.2, 0.28, 0.14)}{caja(0.22, 0.1, 0.2, 0.3, 0.14)}{caja(0.58, 0.1, 0.2, 0.3, 0.14)}{caja(0.8, 0.38, 0.2, 0.28, 0.14)}
    </div>
  );
  return caja2;
}

export function TarjetaReporte({ d }: { d: DatosReporte }) {
  const perdido = d.kind === "perdido";
  const nombre = d.especie === "otro" ? "mascota" : d.especie;
  const titulo = perdido ? (d.especie === "otro" ? "¿La has visto?" : "¿Lo has visto?") : `¿Es tu ${nombre}?`;
  const tamTitulo = titulo.length <= 13 ? 128 : titulo.length <= 16 ? 108 : 90;
  const color = perdido ? "#e0523f" : "#1f9d6b";
  const r = d.foto ? d.foto.w / d.foto.h : 1.5;
  const [fw, fh] = !d.foto ? [840, 520] : r >= 1.1 ? [840, 520] : r >= 0.8 ? [640, 540] : [470, 540];
  const zona = d.zona.length > 30 ? `${d.zona.slice(0, 29).trim()}…` : d.zona;
  const etiquetas = [d.especie === "otro" ? "Mascota" : d.especie.charAt(0).toUpperCase() + d.especie.slice(1), `${perdido ? "Desde el" : "Reportado el"} ${d.fecha}`];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: 1080, height: 1080, backgroundImage: FONDO, color: NAVY }}>
      <Huella s={260} color="rgba(19,40,79,0.07)" left={-50} top={620} rot={-18} />
      <Huella s={200} color="rgba(19,40,79,0.07)" left={880} top={40} rot={20} />

      <div style={{ display: "flex", marginTop: 46, fontSize: tamTitulo, lineHeight: 1, ...DISPLAY, color: NAVY }}>{titulo}</div>
      <div style={{ display: "flex", marginTop: 16, padding: "9px 30px", borderRadius: 44, background: color, color: "#ffffff", fontSize: 36, ...DISPLAY }}>
        {perdido ? "Se perdió en " : "Se encontró en "}{zona}
      </div>

      <div style={{ display: "flex", marginTop: 30, width: fw, height: fh, borderRadius: 40, border: "10px solid #ffffff", overflow: "hidden", background: "#ffffff", transform: "rotate(-2deg)", boxShadow: "0 24px 44px rgba(19,40,79,0.30)" }}>
        {d.foto ? (
          <img src={d.foto.uri} width={fw - 20} height={fh - 20} style={{ width: fw - 20, height: fh - 20, objectFit: "cover", objectPosition: "50% 35%" }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: fw - 20, height: fh - 20, background: "#1d3a73" }}>
            <Huella s={260} color={SOL} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", marginTop: 26 }}>
        {etiquetas.map((t) => (
          <div key={t} style={{ display: "flex", marginLeft: 6, marginRight: 6, padding: "5px 22px", borderRadius: 30, background: NAVY, color: "#ffffff", fontSize: 28 }}>{t}</div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "absolute", left: 0, bottom: 0, width: 1080, height: 176, padding: "0 56px", background: NAVY }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Huella s={34} color={SOL} />
            <div style={{ display: "flex", marginLeft: 10, fontSize: 30, color: "#ffffff", ...DISPLAY }}>Huellitas HMO</div>
          </div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 40, fontWeight: 700, color: "#ffffff", lineHeight: 1.05 }}>
            {perdido ? "Si tienes información, entra aquí" : `Si es tu ${nombre}, entra aquí`}
          </div>
          <div style={{ display: "flex", marginTop: 4, fontSize: 30, fontWeight: 700, color: SOL }}>huellitashmo.site</div>
        </div>
        {d.qr && (
          <div style={{ display: "flex", padding: 12, background: "#ffffff", borderRadius: 22 }}>
            <img src={d.qr} width={140} height={140} />
          </div>
        )}
      </div>
    </div>
  );
}
