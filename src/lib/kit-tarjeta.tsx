// Imagen vertical (1080x1350) para compartir a un animal en adopción: su foto ocupa toda la imagen y los datos van encima, como un boletín de adopción.
import { ALTO, ANCHO, Banner, BarraInferior, DISPLAY, FotoCompleta, Ficha, NAVY, type FotoKit } from "@/lib/kit-comun";

export type { FotoKit };
export type DatosKit = {
  nombre: string;
  foto: FotoKit | null;
  datos: { t: string; v: string }[];   // hasta 3 fichas: EDAD, TAMAÑO, ESTADO...
  estado: "disponible" | "en_cuidados" | "adoptado";
  cta: string;           // ej. "Adóptala"
  qr: string | null;     // data URI del código QR hacia la ficha
};

export function textoBanner(estado: DatosKit["estado"]) {
  return estado === "adoptado" ? "¡YA TIENE HOGAR!" : estado === "en_cuidados" ? "SE ESTÁ RECUPERANDO" : "BUSCA HOGAR";
}

function tamNombre(n: string) {
  return n.length <= 7 ? 74 : n.length <= 11 ? 60 : n.length <= 16 ? 48 : 38;
}

export function TarjetaKit({ d }: { d: DatosKit }) {
  const nombre = d.nombre.length > 24 ? `${d.nombre.slice(0, 23).trim()}…` : d.nombre;
  const color = d.estado === "adoptado" ? "#1f9d6b" : d.estado === "en_cuidados" ? "#2f68c9" : NAVY;
  return (
    <div style={{ display: "flex", flexDirection: "column", position: "relative", width: ANCHO, height: ALTO, background: NAVY }}>
      <FotoCompleta foto={d.foto} />
      <Banner texto={textoBanner(d.estado)} color={color} tam={d.estado === "en_cuidados" ? 50 : 58} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", position: "absolute", left: 40, bottom: 204, width: 1000 }}>
        <Ficha titulo="NOMBRE" valor={nombre} ancho={500} tam={tamNombre(nombre)} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {d.datos.slice(0, 3).map((x, i) => (
            <div key={x.t} style={{ display: "flex", marginTop: i === 0 ? 0 : 14 }}>
              <Ficha titulo={x.t} valor={x.v} ancho={440} tam={x.v.length > 14 ? 34 : 42} />
            </div>
          ))}
        </div>
      </div>
      <BarraInferior cta={d.cta} qr={d.qr} />
    </div>
  );
}
