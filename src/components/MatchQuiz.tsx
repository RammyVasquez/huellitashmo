"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { recomendar, type Answers } from "@/lib/match";
import type { Animal } from "@/lib/types";

type Opt = { value: string; label: string; text?: string };
type Step = { id: "species" | "space" | "activity" | "convive" | "age"; title: string; multi?: boolean; options: Opt[] };

const STEPS: Step[] = [
  { id: "species", title: "¿A quién quieres en casa?", options: [
    { value: "perro", label: "Un perro" }, { value: "gato", label: "Un gato" }, { value: "cualquiera", label: "Me da igual" } ] },
  { id: "space", title: "¿Cómo es tu espacio?", options: [
    { value: "patio", label: "Casa con patio o espacio abierto" }, { value: "chico", label: "Departamento o espacio chico" } ] },
  { id: "activity", title: "¿Cómo es tu ritmo de vida?", options: [
    { value: "tranquilo", label: "Tranquilo", text: "Prefiero planes en casa" },
    { value: "moderado", label: "Moderado", text: "Salgo a caminar de vez en cuando" },
    { value: "activo", label: "Muy activo", text: "Salgo a correr o hago mucho ejercicio" } ] },
  { id: "convive", title: "¿Quién vive contigo?", multi: true, options: [
    { value: "ninos", label: "Hay niños pequeños" }, { value: "animales", label: "Tengo otros animales" }, { value: "ninguno", label: "Ninguno de los dos" } ] },
  { id: "age", title: "¿Qué edad prefieres?", options: [
    { value: "cachorro", label: "Cachorro", text: "Menos de 1 año" }, { value: "joven", label: "Joven", text: "De 1 a 3 años" },
    { value: "adulto", label: "Adulto", text: "De 3 a 8 años" }, { value: "senior", label: "Senior", text: "Más de 8 años" },
    { value: "igual", label: "Me da igual" } ] },
];

export default function MatchQuiz({ animals }: { animals: Animal[] }) {
  const [paso, setPaso] = useState(0);
  const [resp, setResp] = useState<Record<string, string[]>>({});
  const [fin, setFin] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => { titulo.current?.focus(); }, [paso, fin]);

  const step = STEPS[paso];
  const actual = resp[step.id] ?? [];

  function elegir(valor: string) {
    setResp((r) => {
      if (!step.multi) return { ...r, [step.id]: [valor] };
      const cur = r[step.id] ?? [];
      if (valor === "ninguno") return { ...r, [step.id]: cur.includes("ninguno") ? [] : ["ninguno"] };
      const sin = cur.filter((v) => v !== "ninguno");
      return { ...r, [step.id]: sin.includes(valor) ? sin.filter((v) => v !== valor) : [...sin, valor] };
    });
  }

  const salida = useMemo(() => {
    if (!fin) return null;
    const ans: Answers = {
      species: resp.species[0] as Answers["species"],
      space: resp.space[0] as Answers["space"],
      activity: resp.activity[0] as Answers["activity"],
      kids: resp.convive.includes("ninos"),
      pets: resp.convive.includes("animales"),
      age: resp.age[0] as Answers["age"],
    };
    return recomendar(animals, ans);
  }, [fin, resp, animals]);

  function reiniciar() { setResp({}); setPaso(0); setFin(false); }

  if (fin && salida) {
    const { results, excluidos } = salida;
    return (
      <div>
        <h2 ref={titulo} tabIndex={-1}>{results.length ? "Ellos podrían ser tu match" : "Aún no encontramos un match"}</h2>
        <p className="muted">Es una guía: la mejor decisión se toma conociéndolo y platicando con el refugio.</p>
        {excluidos > 0 && (
          <p className="box">Dejamos fuera {excluidos} {excluidos === 1 ? "animal que no se lleva" : "animales que no se llevan"} bien con niños u otros animales, según lo que nos dijiste.</p>
        )}
        {results.length === 0 ? (
          <div className="empty">
            Por ahora ningún animal encaja con esas respuestas. Prueba cambiándolas o <Link href="/animales">mira a todos los animales</Link>.
          </div>
        ) : (
          <div className="grid match">
            {results.map(({ animal: a, tier, reasons, missing }) => (
              <article className="card" key={a.id}>
                <Link href={`/animales/${a.id}`} aria-label={`Conocer a ${a.name}`}>
                  {a.photo_url ? <img src={a.photo_url} alt={`Foto de ${a.name}`} loading="lazy" /> : <div className="ph" />}
                </Link>
                <div className="body">
                  <span className={`tag ${tier === "Muy buena compatibilidad" ? "ok" : ""}`}>{tier}</span>
                  <h3>{a.name}</h3>
                  <span className="tag">{a.species}</span>{a.age_text && <span className="tag">{a.age_text}</span>}
                  {reasons.length > 0 && <ul className="reasons">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
                  {missing.length > 0 && <p className="muted" style={{ fontSize: ".9rem" }}>Pregunta al refugio por {missing.join(", ")}.</p>}
                  <Link className="btn" href={`/animales/${a.id}`}>Conocer a {a.name}</Link>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="actions">
          <button className="btn ghost" onClick={reiniciar}>Volver a empezar</button>
          <Link className="btn ghost" href="/animales">Ver a todos</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={paso + 1} aria-label={`Pregunta ${paso + 1} de ${STEPS.length}`}>
        <span style={{ width: `${((paso + 1) / STEPS.length) * 100}%` }} />
      </div>
      <p className="muted" style={{ margin: ".5rem 0 1rem" }}>Pregunta {paso + 1} de {STEPS.length}</p>
      <h2 ref={titulo} tabIndex={-1}>{step.title}</h2>
      {step.multi && <p className="muted">Puedes elegir más de una.</p>}
      <div className="choices one" role={step.multi ? "group" : "radiogroup"} aria-label={step.title}>
        {step.options.map((o) => {
          const on = actual.includes(o.value);
          return (
            <label key={o.value} className={`choice${on ? " on" : ""}`}>
              <input type={step.multi ? "checkbox" : "radio"} name={step.id} checked={on} onChange={() => elegir(o.value)} />
              <strong>{o.label}</strong>
              {o.text && <span>{o.text}</span>}
            </label>
          );
        })}
      </div>
      <div className="actions">
        {paso > 0 && <button className="btn ghost" onClick={() => setPaso(paso - 1)}>Atrás</button>}
        <button
          className="btn"
          disabled={actual.length === 0}
          onClick={() => (paso === STEPS.length - 1 ? setFin(true) : setPaso(paso + 1))}
        >
          {paso === STEPS.length - 1 ? "Ver mis resultados" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}
