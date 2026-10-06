"use client";
import { useState } from "react";

type Props = {
  tipo: "perdido" | "encontrado";
  especie: string;
  zona: string;
  descripcion: string;
  fotos: string[];
  qrSvg: string;
  ligaCorta: string;
};

// Cartel tamaño carta/A4. Todas las medidas usan cqw (porcentaje del ancho del cartel) para que se vea igual en pantalla y al imprimir.
export default function CartelEditor({ tipo, especie, zona, descripcion, fotos, qrSvg, ligaCorta }: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nota, setNota] = useState("");
  const perdido = tipo === "perdido";

  return (
    <>
      <div className="no-print cartel-controles">
        <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)" }}>Cartel para imprimir</h1>
        <p className="muted" style={{ maxWidth: "65ch" }}>
          Se imprime en una hoja. En el celular: Compartir → Imprimir → con dos dedos sobre la vista previa para guardarlo como PDF.
          Lo que escribas aquí <b>solo se usa en tu impresión</b>: no se guarda ni se publica.
        </p>
        <div className="two">
          {perdido && <label>Nombre de la mascota (opcional)<input value={nombre} maxLength={30} onChange={(e) => setNombre(e.target.value)} /></label>}
          <label>Tu teléfono (opcional, solo el tuyo)<input value={telefono} maxLength={20} inputMode="tel" onChange={(e) => setTelefono(e.target.value)} /></label>
        </div>
        <label>Nota breve (opcional, ej. “Es muy miedoso” o “Se ofrece recompensa”)<input value={nota} maxLength={70} onChange={(e) => setNota(e.target.value)} /></label>
        <div className="actions">
          <button className="btn" onClick={() => window.print()}>Imprimir o guardar PDF</button>
        </div>
      </div>

      <article className="cartel" aria-label="Vista previa del cartel">
        <div className={`cartel-banda ${perdido ? "perdido" : "encontrado"}`}>
          {perdido ? <>SE BUSCA</> : <>¿ES TU MASCOTA?</>}
        </div>
        <div className="cartel-sub">
          {perdido ? (nombre ? `${especie} · Se llama ${nombre}` : especie) : `Se encontró un ${especie.toLowerCase()}`}
        </div>
        <div className={`cartel-fotos${fotos.length > 1 ? " varias" : ""}`}>
          {fotos[0] ? <img src={fotos[0]} alt="Foto principal" className="principal" /> : <div className="principal sin-foto">Sin foto</div>}
          {fotos[1] && <img src={fotos[1]} alt="Foto 2" className="extra e1" />}
          {fotos[2] && <img src={fotos[2]} alt="Foto 3" className="extra e2" />}
        </div>
        <p className="cartel-desc">{descripcion}</p>
        {nota && <p className="cartel-nota">{nota}</p>}
        <p className="cartel-zona"><b>{perdido ? "Se perdió en:" : "Se encontró en:"}</b> {zona}</p>
        <div className="cartel-pie">
          <div className="qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div className="cartel-contacto">
            <b>Escanea el código</b> para ver más fotos y {perdido ? "avisar si la viste" : "contactar a quien la encontró"}.
            <span className="liga">{ligaCorta}</span>
            {telefono && <span className="tel">Llama o escribe: {telefono}</span>}
          </div>
        </div>
        <div className="cartel-firma">Huellitas HMO · Adopta y ayuda en Hermosillo</div>
      </article>
    </>
  );
}
