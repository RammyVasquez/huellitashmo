"use client";
import { useState } from "react";

export default function AnimalGallery({ photos, name }: { photos: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (!photos.length) return <div className="box" style={{ aspectRatio: "4/5" }} />;
  const actual = Math.min(i, photos.length - 1);
  return (
    <div className="galeria">
      <img src={photos[actual]} alt={`Foto ${actual + 1} de ${photos.length} de ${name}`} />
      {photos.length > 1 && (
        <div className="mini" role="group" aria-label="Más fotos">
          {photos.map((u, k) => (
            <button type="button" key={u} aria-pressed={k === actual} aria-label={`Ver foto ${k + 1}`} onClick={() => setI(k)}>
              <img src={u} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
