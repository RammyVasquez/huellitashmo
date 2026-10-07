"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import FotoFit from "./FotoFit";

const INTERVALO_MS = 4000; // tiempo que se ve cada animal

type Item = { id: string; name: string; photo_url: string };

// Foto principal de la portada (computadora): cambia sola entre los animales; se detiene si pasas el cursor o enfocas con teclado.
export default function HeroRotator({ animals }: { animals: Item[] }) {
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [reducido, setReducido] = useState(false);

  useEffect(() => {
    setReducido(window.matchMedia("(prefers-reduced-motion: reduce)").matches); // quien pidió menos movimiento no ve rotación automática
  }, []);

  useEffect(() => {
    if (animals.length < 2 || pausa || reducido) return;
    const t = setInterval(() => setI((x) => (x + 1) % animals.length), INTERVALO_MS);
    return () => clearInterval(t);
  }, [animals.length, pausa, reducido]);

  if (animals.length === 0)
    return <div className="hero-photo solo-escritorio"><div className="ph" /></div>;

  return (
    <div
      className="hero-rot solo-escritorio"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onFocus={() => setPausa(true)}
      onBlur={() => setPausa(false)}
    >
      <div className="hero-photo">
        <div className="hero-rot-marco">
          {animals.map((a, k) => (
            <Link
              key={a.id}
              href={`/animales/${a.id}`}
              className={`hero-slide${k === i ? " on" : ""}`}
              aria-hidden={k !== i}
              tabIndex={k === i ? 0 : -1}
              aria-label={`Conoce a ${a.name}`}
            >
              <FotoFit eager={k === 0} src={a.photo_url} alt={`Foto de ${a.name}`} />
              <span className="hero-tag">Conoce a {a.name}</span>
            </Link>
          ))}
        </div>
      </div>
      {animals.length > 1 && (
        <div className="hero-dots" role="group" aria-label="Elegir animal">
          {animals.map((a, k) => (
            <button key={a.id} type="button" aria-label={`Ver a ${a.name}`} aria-pressed={k === i} onClick={() => setI(k)}>
              <span />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
