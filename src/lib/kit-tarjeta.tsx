// Imagen cuadrada (1080x1080) para compartir a un animal en redes. Dos diseños según la foto:
// vertical -> foto alta a la izquierda y datos a la derecha; horizontal/cuadrada -> foto ancha con el nombre encima.
export type FotoKit = { uri: string; w: number; h: number };
export type DatosKit = {
  nombre: string;
  foto: FotoKit | null;
  etiquetas: string[];
  refugio: string | null;
  estado: "disponible" | "en_cuidados" | "adoptado";
  cta: string;           // ej. "Adóptala"
  qr: string | null;     // data URI del código QR hacia la ficha
  pastilla?: { texto: string; fondo: string; color: string }; // para reportes de mascotas perdidas o encontradas
};

const NAVY = "#13284f";
const SOL = "#ffc933";
const FONDO = "linear-gradient(160deg, #1d3a73 0%, #13284f 52%, #0d1d3d 100%)";
const DISPLAY = { fontFamily: "Fredoka", fontWeight: 600 } as const;

function Huella({ s }: { s: number }) {
  const caja = (l: number, t: number, w: number, h: number, r: number) => (
    <div style={{ display: "flex", position: "absolute", left: l * s, top: t * s, width: w * s, height: h * s, borderRadius: r * s, background: SOL }} />
  );
  return (
    <div style={{ display: "flex", position: "relative", width: s, height: s }}>
      {caja(0.2, 0.54, 0.6, 0.4, 0.22)}
      {caja(0.0, 0.38, 0.2, 0.28, 0.14)}
      {caja(0.22, 0.1, 0.2, 0.3, 0.14)}
      {caja(0.58, 0.1, 0.2, 0.3, 0.14)}
      {caja(0.8, 0.38, 0.2, 0.28, 0.14)}
    </div>
  );
}

function Marca({ tam = 32 }: { tam?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <Huella s={tam + 8} />
      <div style={{ display: "flex", marginLeft: 12, fontSize: tam, ...DISPLAY, color: "#ffffff" }}>Huellitas HMO</div>
    </div>
  );
}

function Pastilla({ estado, pastilla, tam = 30 }: { estado: DatosKit["estado"]; pastilla?: DatosKit["pastilla"]; tam?: number }) {
  if (pastilla) return <div style={{ display: "flex", padding: "8px 24px", borderRadius: 40, background: pastilla.fondo, color: pastilla.color, fontSize: tam, ...DISPLAY }}>{pastilla.texto}</div>;
  const fondo = estado === "adoptado" ? "#2f9e6e" : estado === "en_cuidados" ? "#8fb8ff" : SOL;
  const texto = estado === "adoptado" ? "#ffffff" : NAVY;
  const t = estado === "adoptado" ? "YA TIENE HOGAR" : estado === "en_cuidados" ? "EN CUIDADOS" : "BUSCA HOGAR";
  return <div style={{ display: "flex", padding: "8px 24px", borderRadius: 40, background: fondo, color: texto, fontSize: tam, ...DISPLAY }}>{t}</div>;
}

function Etiquetas({ lista, tam = 28 }: { lista: string[]; tam?: number }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {lista.map((t) => (
        <div key={t} style={{ display: "flex", marginRight: 10, marginBottom: 10, padding: "4px 18px", borderRadius: 40, border: `3px solid ${SOL}`, color: SOL, fontSize: tam }}>{t}</div>
      ))}
    </div>
  );
}

function Qr({ src, lado }: { src: string | null; lado: number }) {
  if (!src) return null;
  const pad = Math.round(lado * 0.09);
  return (
    <div style={{ display: "flex", padding: pad, background: "#ffffff", borderRadius: 24 }}>
      <img src={src} width={lado - 2 * pad} height={lado - 2 * pad} />
    </div>
  );
}

function tamNombre(nombre: string, ancho: number, max: number) {
  const palabra = Math.max(...nombre.split(/\s+/).map((p) => p.length), 1);
  const porLargo = nombre.length > 22 ? 72 : nombre.length > 12 ? 88 : max;
  return Math.max(40, Math.min(max, porLargo, Math.floor(ancho / (palabra * 0.6))));
}

function Adorno() {
  return (
    <>
      <div style={{ display: "flex", position: "absolute", right: -170, bottom: -170, width: 520, height: 520, borderRadius: 260, background: "rgba(255,201,51,0.13)" }} />
      <div style={{ display: "flex", position: "absolute", left: -120, top: -120, width: 320, height: 320, borderRadius: 160, background: "rgba(255,255,255,0.04)" }} />
    </>
  );
}

function PataGrande({ w, h }: { w: number; h: number }) {
  const dy = (h - 544) / 2 - 56;
  const dedos: [number, number][] = [[268, 178], [374, 96], [482, 96], [588, 178]];
  return (
    <div style={{ display: "flex", position: "relative", width: w, height: h, background: "#1d3a73" }}>
      <div style={{ display: "flex", position: "absolute", left: 341, top: 292 + dy, width: 270, height: 206, borderRadius: 120, background: SOL }} />
      {dedos.map(([x, y]) => (
        <div key={x} style={{ display: "flex", position: "absolute", left: x, top: y + dy, width: 96, height: 126, borderRadius: 62, background: SOL }} />
      ))}
    </div>
  );
}

export function TarjetaKit({ d }: { d: DatosKit }) {
  const vertical = !!d.foto && d.foto.h / d.foto.w >= 1.1;

  if (vertical && d.foto) {
    const r = d.foto.w / d.foto.h;
    const fw = Math.max(480, Math.min(560, Math.round(r * 952)));
    const col = 1016 - (64 + fw + 44);
    return (
      <div style={{ display: "flex", position: "relative", width: 1080, height: 1080, padding: 64, backgroundImage: FONDO, color: "#ffffff" }}>
        <Adorno />
        <div style={{ display: "flex", width: fw, height: 952, borderRadius: 44, border: "8px solid #ffffff", overflow: "hidden", background: "#0d1d3d" }}>
          <img src={d.foto.uri} width={fw - 16} height={936} style={{ width: fw - 16, height: 936, objectFit: "cover", objectPosition: "50% 35%" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", marginLeft: 44, width: col, height: 952 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Marca tam={28} />
            <div style={{ display: "flex", marginTop: 34 }}><Pastilla estado={d.estado} pastilla={d.pastilla} tam={26} /></div>
            <div style={{ display: "flex", marginTop: 26, fontSize: tamNombre(d.nombre, col, 104), lineHeight: 1.02, ...DISPLAY }}>{d.nombre}</div>
            <div style={{ display: "flex", marginTop: 22 }}><Etiquetas lista={d.etiquetas} tam={26} /></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Qr src={d.qr} lado={150} />
              <div style={{ display: "flex", marginLeft: 16, fontSize: 22, lineHeight: 1.15, color: "#dbe5f7", width: Math.max(120, col - 166) }}>Escanea para ver más</div>
            </div>
            <div style={{ display: "flex", marginTop: 18, fontSize: 34, fontWeight: 700, color: SOL, lineHeight: 1.1 }}>{d.cta}</div>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>huellitashmo.site</div>
            {d.refugio && <div style={{ display: "flex", marginTop: 8, fontSize: 22, color: "#dbe5f7" }}>{d.refugio}</div>}
          </div>
        </div>
      </div>
    );
  }

  // horizontal, cuadrada o sin foto
  return (
    <div style={{ display: "flex", flexDirection: "column", position: "relative", width: 1080, height: 1080, padding: 56, backgroundImage: FONDO, color: "#ffffff" }}>
      <Adorno />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Marca tam={32} />
        <Pastilla estado={d.estado} pastilla={d.pastilla} />
      </div>
      <div style={{ display: "flex", position: "relative", marginTop: 26, width: 968, height: 580, borderRadius: 44, border: "8px solid #ffffff", overflow: "hidden", background: "#0d1d3d" }}>
        {d.foto ? (
          <img src={d.foto.uri} width={952} height={564} style={{ width: 952, height: 564, objectFit: "cover", objectPosition: "50% 30%" }} />
        ) : (
          <PataGrande w={952} h={564} />
        )}
        <div style={{ display: "flex", position: "absolute", left: 0, bottom: 0, width: 952, height: 250, backgroundImage: "linear-gradient(to top, rgba(13,29,61,0.94), rgba(13,29,61,0))" }} />
        <div style={{ display: "flex", position: "absolute", left: 34, bottom: 22, width: 880, fontSize: tamNombre(d.nombre, 880, 108), lineHeight: 1.02, color: "#ffffff", ...DISPLAY }}>{d.nombre}</div>
      </div>
      <div style={{ display: "flex", marginTop: 24 }}><Etiquetas lista={d.etiquetas} /></div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 700 }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: SOL, lineHeight: 1.05 }}>{d.cta}</div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, marginTop: 6 }}>huellitashmo.site</div>
          {d.refugio && <div style={{ display: "flex", marginTop: 8, fontSize: 26, color: "#dbe5f7" }}>{d.refugio}</div>}
        </div>
        <Qr src={d.qr} lado={170} />
      </div>
    </div>
  );
}
