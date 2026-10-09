"use client";
import { useState } from "react";

type NavConCompartir = Navigator & { canShare?: (d: ShareData) => boolean };

export default function KitCompartir({ id, nombre, textoInicial, archivo, imagen: imagenProp }: { id: string; nombre: string; textoInicial: string; archivo: string; imagen?: string }) {
  const [texto, setTexto] = useState(textoInicial);
  const [copiado, setCopiado] = useState(false);
  const [aviso, setAviso] = useState("");
  const imagen = imagenProp ?? `/api/kit/${id}/imagen`;

  async function copiar() {
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }
    catch { window.prompt("Copia este texto:", texto); }
  }

  async function compartir() {
    setAviso("");
    try {
      const res = await fetch(imagen);
      const archivoImg = new File([await res.blob()], `${archivo}.png`, { type: "image/png" });
      const nav = navigator as NavConCompartir;
      if (nav.canShare?.({ files: [archivoImg] })) await navigator.share({ files: [archivoImg], text: texto });
      else if (navigator.share) await navigator.share({ text: texto });
      else setAviso("Tu navegador no permite compartir directo: descarga la imagen y copia el texto.");
    } catch { /* la persona canceló */ }
  }

  return (
    <div className="kit">
      <div>
        <img className="kit-img" src={imagen} alt={`Imagen para compartir a ${nombre}`} width={540} height={540} />
        <div className="actions">
          <a className="btn" href={`${imagen}?descargar=1`} download={`${archivo}.png`}>Descargar imagen</a>
          {typeof navigator !== "undefined" && "share" in navigator && <button className="btn ghost" onClick={compartir}>Compartir</button>}
        </div>
        {aviso && <p className="muted" role="status">{aviso}</p>}
      </div>
      <div className="stack" style={{ maxWidth: "none" }}>
        <label>Texto para publicar (puedes editarlo)
          <textarea rows={14} value={texto} onChange={(e) => setTexto(e.target.value)} />
        </label>
        <button className="btn alt" onClick={copiar}>{copiado ? "¡Texto copiado!" : "Copiar texto"}</button>
        <p className="muted" style={{ margin: 0, fontSize: ".92rem" }}>
          Publica la imagen y pega el texto. La liga lleva directo a la ficha del animal.
        </p>
      </div>
    </div>
  );
}
