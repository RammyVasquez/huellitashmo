// Piezas compartidas por las imágenes para compartir (animales en adopción y reportes de mascotas)
export type FotoKit = { uri: string; w: number; h: number };

export const NAVY = "#13284f";
export const SOL = "#ffc933";
export const FONDO = "linear-gradient(165deg, #ffe08a 0%, #ffc933 48%, #ffb41f 100%)";
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

export function Adornos() {
  return (
    <>
      <Huella s={260} color="rgba(19,40,79,0.07)" left={-50} top={620} rot={-18} />
      <Huella s={200} color="rgba(19,40,79,0.07)" left={880} top={40} rot={20} />
    </>
  );
}

// Tamaño del marco según la foto: ancha, casi cuadrada o alta
export function tamanoMarco(foto: FotoKit | null): [number, number] {
  if (!foto) return [840, 520];
  const r = foto.w / foto.h;
  return r >= 1.1 ? [840, 520] : r >= 0.8 ? [640, 540] : [470, 540];
}

export function MarcoFoto({ foto, margen = 24 }: { foto: FotoKit | null; margen?: number }) {
  const [fw, fh] = tamanoMarco(foto);
  return (
    <div style={{ display: "flex", marginTop: margen, width: fw, height: fh, borderRadius: 40, border: "10px solid #ffffff", overflow: "hidden", background: "#ffffff", transform: "rotate(-2deg)", boxShadow: "0 24px 44px rgba(19,40,79,0.30)" }}>
      {foto ? (
        <img src={foto.uri} width={fw - 20} height={fh - 20} style={{ width: fw - 20, height: fh - 20, objectFit: "cover", objectPosition: "50% 35%" }} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: fw - 20, height: fh - 20, background: "#1d3a73" }}>
          <Huella s={260} color={SOL} />
        </div>
      )}
    </div>
  );
}

export function Etiquetas({ lista }: { lista: string[] }) {
  return (
    <div style={{ display: "flex" }}>
      {lista.map((t) => (
        <div key={t} style={{ display: "flex", marginLeft: 6, marginRight: 6, padding: "5px 22px", borderRadius: 30, background: NAVY, color: "#ffffff", fontSize: 28 }}>{t}</div>
      ))}
    </div>
  );
}

export function BarraInferior({ cta, extra, qr }: { cta: string; extra?: string | null; qr: string | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "absolute", left: 0, bottom: 0, width: 1080, height: 176, padding: "0 56px", background: NAVY }}>
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
