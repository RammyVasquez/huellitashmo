"use client";
import { useEffect, useState } from "react";

export default function ShareButtons({ text }: { text: string }) {
  const [url, setUrl] = useState("");
  const [nativo, setNativo] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setNativo(typeof navigator.share === "function");
  }, []);

  if (!url) return null;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt("Copia esta liga:", url);
    }
  }

  return (
    <div className="share">
      <b>Comparte para ayudar a que lo vean más personas</b>
      <div className="actions" style={{ margin: ".5rem 0 0" }}>
        {nativo && (
          <button className="btn ghost" onClick={() => navigator.share({ title: text, text, url }).catch(() => {})}>Compartir</button>
        )}
        <a className="btn ghost" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}>WhatsApp</a>
        <a className="btn ghost" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Facebook</a>
        <button className="btn ghost" onClick={copiar}>{copiado ? "¡Liga copiada!" : "Copiar liga"}</button>
      </div>
    </div>
  );
}
