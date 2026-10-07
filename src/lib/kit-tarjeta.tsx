// Imagen cuadrada (1080x1080) para compartir a un animal en redes
export type DatosKit = { nombre: string; foto: string | null; etiquetas: string[]; refugio: string | null; adoptado: boolean };

function Pata() {
  const dedos: [number, number][] = [[268, 178], [374, 96], [482, 96], [588, 178]];
  return (
    <div style={{ display: "flex", position: "relative", width: 952, height: 544, background: "#1d3a73" }}>
      <div style={{ display: "flex", position: "absolute", left: 341, top: 292, width: 270, height: 206, borderRadius: 120, background: "#ffc933" }} />
      {dedos.map(([x, y]) => (
        <div key={x} style={{ display: "flex", position: "absolute", left: x, top: y, width: 96, height: 126, borderRadius: 62, background: "#ffc933" }} />
      ))}
    </div>
  );
}

export function TarjetaKit({ d }: { d: DatosKit }) {
  const tam = d.nombre.length > 16 ? 70 : d.nombre.length > 11 ? 82 : 96;
  return (
    <div style={{ display: "flex", position: "relative", width: 1080, height: 1080, background: "#13284f", color: "#ffffff" }}>
      {d.foto && <img src={d.foto} width={1080} height={1080} style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1080, objectFit: "cover" }} />}
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: 1080, height: 1080, background: "rgba(19,40,79,0.88)" }} />
      <div style={{ display: "flex", flexDirection: "column", position: "absolute", top: 0, left: 0, width: 1080, height: 1080, padding: 56 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", padding: "10px 28px", borderRadius: 40, background: d.adoptado ? "#2f9e6e" : "#ffc933", color: d.adoptado ? "#ffffff" : "#13284f", fontSize: 34, fontWeight: 700 }}>
            {d.adoptado ? "YA TIENE HOGAR" : "BUSCA HOGAR"}
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>Huellitas HMO</div>
        </div>

        <div style={{ display: "flex", marginTop: 28, width: 968, height: 560, borderRadius: 36, border: "8px solid #ffffff", overflow: "hidden", background: "#eef3fb" }}>
          {d.foto ? <img src={d.foto} width={952} height={544} style={{ width: 952, height: 544, objectFit: "contain" }} /> : <Pata />}
        </div>

        <div style={{ display: "flex", marginTop: 26, fontSize: tam, fontWeight: 700, lineHeight: 1.05 }}>{d.nombre}</div>
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 14 }}>
          {d.etiquetas.map((t) => (
            <div key={t} style={{ display: "flex", marginRight: 12, marginBottom: 8, padding: "4px 20px", borderRadius: 40, border: "3px solid #ffc933", color: "#ffc933", fontSize: 30 }}>{t}</div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: "#ffc933" }}>
            {d.adoptado ? "Conoce a quienes aún esperan: huellitashmo.site" : "Adóptalo en huellitashmo.site"}
          </div>
          {d.refugio && <div style={{ display: "flex", marginTop: 6, fontSize: 28, color: "#dbe5f7" }}>{d.refugio}</div>}
        </div>
      </div>
    </div>
  );
}
