// Piezas compartidas por las imágenes para compartir (animales en adopción y reportes de mascotas).
// Formato vertical 1080x1350 (4:5): la foto ocupa toda la imagen y los datos van encima.
export type FotoKit = { uri: string; w: number; h: number };

export const ANCHO = 1080;
export const ALTO = 1350;
export const NAVY = "#13284f";
export const SOL = "#ffc933";
export const CREMA = "#fff7e0";
export const DORADO = "#d99a0b";
export const DISPLAY = { fontFamily: "Fredoka", fontWeight: 600 } as const;

export function Huella({ s, color, left, top, rot = 0 }: { s: number; color: string; left?: number; top?: number; rot?: number }) {
  const caja = (l: number, t: number, w: number, h: number, r: number) => (
    <div style={{ display: "flex", position: "absolute", left: l * s, top: t * s, width: w * s, height: h * s, borderRadius: r * s, background: color }} />
  );
  const base = { display: "flex", position: "relative" as const, width: s, height: s, transform: `rotate(${rot}deg)` };
  return (
    <div style={left !== undefined ? { ...base, position: "absolute", left, top } : base}>
      {caja(0.2, 0.54, 0.6, 0.4, 0.22)}{caja(0, 0.38, 0.2, 0.28, 0.14)}{caja(0.22, 0.1, 0.2, 0.3, 0.14)}{caja(0.58, 0.1, 0.2, 0.3, 0.14)}{caja(0.8, 0.38, 0.2, 0.28, 0.14)}
    </div>
  );
}

// La foto cubre toda la imagen; abajo se oscurece un poco para que se lean las fichas y la barra
export function FotoCompleta({ foto }: { foto: FotoKit | null }) {
  return (
    <>
      <div style={{ display: "flex", position: "absolute", left: 0, top: 0, width: ANCHO, height: ALTO, background: NAVY }}>
        {foto ? (
          <img src={foto.uri} width={ANCHO} height={ALTO} style={{ width: ANCHO, height: ALTO, objectFit: "cover", objectPosition: "50% 30%" }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: ANCHO, height: ALTO, backgroundImage: "linear-gradient(160deg, #1d3a73, #13284f)", paddingBottom: 380 }}>
            <Huella s={340} color={SOL} />
          </div>
        )}
      </div>
      <div style={{ display: "flex", position: "absolute", left: 0, top: ALTO - 640, width: ANCHO, height: 640, backgroundImage: "linear-gradient(to top, rgba(13,29,61,0.95) 0%, rgba(13,29,61,0.72) 45%, rgba(13,29,61,0) 100%)" }} />
    </>
  );
}

// Cartel crema de arriba, con huellitas a los lados
export function Banner({ texto, color = NAVY, tam = 58 }: { texto: string; color?: string; tam?: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", width: ANCHO, marginTop: 44 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 40px", borderRadius: 42, background: "rgba(255,247,224,0.97)", boxShadow: "0 12px 30px rgba(0,0,0,0.30)" }}>
        <Huella s={46} color={DORADO} />
        <div style={{ display: "flex", margin: "0 22px", fontSize: tam, lineHeight: 1.05, color, ...DISPLAY }}>{texto}</div>
        <Huella s={46} color={DORADO} />
      </div>
    </div>
  );
}

// Ficha: etiqueta pequeña oscura y valor en caja crema (como un boletín de adopción)
export function Ficha({ titulo, valor, ancho, tam = 46 }: { titulo: string; valor: string; ancho: number; tam?: number }) {
  const v = valor.length > 26 ? `${valor.slice(0, 25).trim()}…` : valor;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: ancho }}>
      <div style={{ display: "flex", padding: "3px 26px", borderRadius: 20, background: NAVY, color: "#ffffff", fontSize: 24, fontWeight: 700, letterSpacing: 2, border: `2px solid ${CREMA}` }}>{titulo}</div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: ancho, marginTop: 6, padding: "8px 16px", borderRadius: 26, background: CREMA, boxShadow: "0 8px 20px rgba(0,0,0,0.30)", color: NAVY, fontSize: tam, lineHeight: 1.05, textAlign: "center", ...DISPLAY }}>{v}</div>
    </div>
  );
}

export function BarraInferior({ cta, extra, qr }: { cta: string; extra?: string | null; qr: string | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "absolute", left: 0, bottom: 0, width: ANCHO, height: 176, padding: "0 56px", background: NAVY }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Huella s={34} color={SOL} />
          <div style={{ display: "flex", marginLeft: 10, fontSize: 30, color: "#ffffff", ...DISPLAY }}>Huellitas HMO</div>
        </div>
        <div style={{ display: "flex", marginTop: 8, fontSize: 40, fontWeight: 700, color: "#ffffff", lineHeight: 1.05 }}>{cta}</div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: SOL }}>huellitashmo.site</div>
          {extra && <div style={{ display: "flex", marginLeft: 14, fontSize: 24, color: "#dbe5f7" }}>{extra.length > 30 ? `${extra.slice(0, 29).trim()}…` : extra}</div>}
        </div>
      </div>
      {qr && (
        <div style={{ display: "flex", padding: 12, background: "#ffffff", borderRadius: 22 }}>
          <img src={qr} width={140} height={140} />
        </div>
      )}
    </div>
  );
}
