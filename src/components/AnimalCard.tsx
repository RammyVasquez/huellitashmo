import Link from "next/link";
import type { Animal } from "@/lib/types";
import FotoFit from "./FotoFit";
import { esteril } from "@/lib/animales";

export default function AnimalCard({ a }: { a: Animal }) {
  return (
    <Link href={`/animales/${a.id}`} className="card">
      {a.photo_url ? <FotoFit src={a.photo_url} alt={`Foto de ${a.name}`} /> : <div className="ph" />}
      <div className="body">
        <h3>{a.name}</h3>
        <div>
          <span className="tag">{a.species}</span>
          {a.age_text && <span className="tag">{a.age_text}</span>}
          {a.sterilized && <span className="tag ok">{esteril(a.sex)}</span>}
          {a.status === "en_cuidados" && <span className="tag urgente">en cuidados</span>}
        </div>
      </div>
    </Link>
  );
}
