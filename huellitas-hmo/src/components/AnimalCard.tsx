import Link from "next/link";
import type { Animal } from "@/lib/types";

export default function AnimalCard({ a }: { a: Animal }) {
  return (
    <Link href={`/animales/${a.id}`} className="card">
      {a.photo_url ? <img src={a.photo_url} alt={`Foto de ${a.name}`} loading="lazy" /> : <div className="ph" />}
      <div className="body">
        <h3>{a.name}</h3>
        <span className="tag">{a.species}</span>
        {a.age_text && <span className="tag">{a.age_text}</span>}
        {a.sterilized && <span className="tag ok">esterilizado</span>}
      </div>
    </Link>
  );
}
