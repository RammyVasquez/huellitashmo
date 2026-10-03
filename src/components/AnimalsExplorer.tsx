"use client";
import { useMemo, useState } from "react";
import { coincide } from "@/lib/buscar";
import type { Animal } from "@/lib/types";
import AnimalCard from "./AnimalCard";

const EDAD = { cachorro: "cachorro", joven: "joven", adulto: "adulto", senior: "senior" } as const;
const TAMANO = { pequeno: "pequeño chico", mediano: "mediano", grande: "grande" } as const;
const ENERGIA = { tranquilo: "tranquilo calmado", moderado: "moderado", activo: "activo energico jugueton" } as const;

function textoDe(a: Animal) {
  return [
    a.name, a.species, a.sex, a.age_text, a.description,
    a.age_group && EDAD[a.age_group], a.size && TAMANO[a.size], a.energy && ENERGIA[a.energy],
    a.good_kids === "si" && "niños", a.good_pets === "si" && "otros animales",
    a.sterilized && "esterilizado", a.vaccinated && "vacunado",
  ].filter(Boolean).join(" ");
}

export default function AnimalsExplorer({ animals, especieInicial }: { animals: Animal[]; especieInicial?: string }) {
  const [especie, setEspecie] = useState<"todos" | "perro" | "gato">(especieInicial === "perro" || especieInicial === "gato" ? especieInicial : "todos");
  const [q, setQ] = useState("");

  const lista = useMemo(
    () => animals.filter((a) => (especie === "todos" || a.species === especie) && coincide(q, textoDe(a))),
    [animals, especie, q]
  );

  return (
    <>
      <label className="buscador">Buscar por nombre, carácter o descripción
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. tranquilo, cachorro, se lleva bien con niños" />
      </label>
      <div className="chips" role="group" aria-label="Filtrar por especie">
        <button type="button" aria-pressed={especie === "todos"} onClick={() => setEspecie("todos")}>Todos</button>
        <button type="button" aria-pressed={especie === "perro"} onClick={() => setEspecie("perro")}>Perros</button>
        <button type="button" aria-pressed={especie === "gato"} onClick={() => setEspecie("gato")}>Gatos</button>
      </div>
      {(q.trim() || especie !== "todos") && (
        <p className="muted" role="status">
          Mostrando {lista.length} de {animals.length}.{" "}
          {q.trim() && <button type="button" className="link" onClick={() => setQ("")}>Limpiar búsqueda</button>}
        </p>
      )}
      {lista.length === 0 ? (
        <div className="empty">No encontramos animales con esa búsqueda. Prueba con otras palabras o quita algún filtro.</div>
      ) : (
        <div className="grid">{lista.map((a) => <AnimalCard key={a.id} a={a} />)}</div>
      )}
    </>
  );
}
