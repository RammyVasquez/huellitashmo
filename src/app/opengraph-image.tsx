import { ImageResponse } from "next/og";

export const alt = "Huellitas HMO · Adopta y ayuda en Hermosillo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#13284f", color: "#fff" }}>
        <div style={{ display: "flex", width: 140, height: 14, background: "#ffc933", marginBottom: 40 }} />
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05 }}>Huellitas HMO</div>
        <div style={{ fontSize: 46, marginTop: 28, color: "#ffc933" }}>Adopta, apadrina y ayuda en Hermosillo</div>
        <div style={{ fontSize: 32, marginTop: 20, color: "#dbe5f7" }}>Refugios, mascotas perdidas y donativos en especie</div>
      </div>
    ),
    size
  );
}
