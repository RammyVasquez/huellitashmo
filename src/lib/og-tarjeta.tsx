// Diseño de la tarjeta que se ve al compartir el sitio en Facebook, WhatsApp, etc. (1200x630)
const marco = { display: "flex", borderRadius: 28, overflow: "hidden", border: "6px solid #ffffff", background: "#eef3fb" } as const;

function Foto({ src, w, h }: { src: string; w: number; h: number }) {
  return (
    <div style={{ ...marco, width: w, height: h }}>
      <img src={src} width={w} height={h} style={{ objectFit: "cover", width: w, height: h }} />
    </div>
  );
}

function Pata() {
  const dedos: [number, number][] = [[62, 190], [152, 112], [256, 112], [346, 190]];
  return (
    <div style={{ display: "flex", position: "relative", width: 488, height: 500, borderRadius: 28, background: "#1d3a73" }}>
      <div style={{ display: "flex", position: "absolute", left: 134, top: 262, width: 220, height: 178, borderRadius: 110, background: "#ffc933" }} />
      {dedos.map(([x, y]) => (
        <div key={x} style={{ display: "flex", position: "absolute", left: x, top: y, width: 80, height: 104, borderRadius: 52, background: "#ffc933" }} />
      ))}
    </div>
  );
}

function Collage({ fotos }: { fotos: string[] }) {
  if (fotos.length >= 3)
    return (
      <div style={{ display: "flex", gap: 16 }}>
        <Foto src={fotos[0]} w={236} h={500} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Foto src={fotos[1]} w={236} h={242} />
          <Foto src={fotos[2]} w={236} h={242} />
        </div>
      </div>
    );
  if (fotos.length === 2)
    return (
      <div style={{ display: "flex", gap: 16 }}>
        <Foto src={fotos[0]} w={236} h={500} />
        <Foto src={fotos[1]} w={236} h={500} />
      </div>
    );
  if (fotos.length === 1) return <Foto src={fotos[0]} w={488} h={500} />;
  return <Pata />;
}

export function TarjetaOg({ fotos }: { fotos: string[] }) {
  return (
    <div style={{ width: 1200, height: 630, display: "flex", background: "#13284f", color: "#ffffff", padding: 56 }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingRight: 40 }}>
        <div style={{ display: "flex", width: 120, height: 12, background: "#ffc933", marginBottom: 36 }} />
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.02 }}>Huellitas HMO</div>
        <div style={{ fontSize: 38, marginTop: 24, color: "#ffc933", lineHeight: 1.2 }}>Adopta, apadrina y ayuda en Hermosillo</div>
        <div style={{ fontSize: 26, marginTop: 28, color: "#dbe5f7", lineHeight: 1.3 }}>Animales en adopción · mascotas perdidas · donativos en especie</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 520 }}>
        <Collage fotos={fotos} />
      </div>
    </div>
  );
}
