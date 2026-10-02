"use client";
import { useRef, useState } from "react";

export default function PhotoStrip({ photos, alt }: { photos: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  if (photos.length === 0) return <div className="ph" />;
  if (photos.length === 1) return <img src={photos[0]} alt={alt} loading="lazy" />;

  const mover = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth, behavior: "smooth" });

  return (
    <div className="strip-wrap">
      <div
        className="strip"
        ref={ref}
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {photos.map((u, k) => (
          <img key={u} src={u} alt={`${alt} (foto ${k + 1} de ${photos.length})`} loading="lazy" />
        ))}
      </div>
      <button type="button" className="strip-btn prev" aria-label="Foto anterior" onClick={() => mover(-1)}>‹</button>
      <button type="button" className="strip-btn next" aria-label="Foto siguiente" onClick={() => mover(1)}>›</button>
      <span className="strip-count" aria-hidden="true">{i + 1} / {photos.length}</span>
    </div>
  );
}
