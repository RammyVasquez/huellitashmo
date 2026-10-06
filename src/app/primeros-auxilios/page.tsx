import Link from "next/link";
import HelpContacts from "@/components/HelpContacts";
import { EMERGENCIAS } from "@/lib/primeros-auxilios";
import { supabase } from "@/lib/supabase";
import type { HelpContact } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Primeros auxilios para mascotas · Huellitas HMO",
  description: "Qué hacer en los primeros minutos de una emergencia con un perro o un gato, mientras llegas con el veterinario.",
};

// Si quien elaboró la guía es médico veterinario, escribe aquí su nombre y cédula para mostrarlo. Ej.: "MVZ Nombre Apellido, cédula 0000000"
const AUTORIA = "";

function Paso({ texto }: { texto: string }) {
  const esNo = /^No /.test(texto);
  return (
    <li className={esNo ? "no" : undefined}>
      {esNo ? <><strong>No</strong> {texto.slice(3)}</> : texto}
    </li>
  );
}

export default async function PrimerosAuxilios() {
  const { data } = await supabase.from("help_contacts").select("*").order("sort").order("name");
  const contacts = (data ?? []) as HelpContact[];

  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Primeros auxilios para mascotas</h1>
      <p className="lead">Qué hacer en los primeros minutos de una emergencia, mientras llegas con el veterinario.</p>

      <p className="alertbox" role="note">
        <b>Los primeros auxilios no sustituyen la atención veterinaria.</b> Aunque tu mascota se vea mejor, debe ser valorada por un médico veterinario. Son recomendaciones para ganar tiempo mientras se traslada a una clínica.
      </p>

      <HelpContacts contacts={contacts} />
      <p className="muted">
        Llama a la veterinaria <b>mientras</b> preparas el traslado. Cuida tu seguridad: un animal con dolor puede morder por miedo.
      </p>

      <nav aria-label="Emergencias" className="chips" style={{ marginTop: "1.4rem" }}>
        {EMERGENCIAS.map((e) => <a key={e.id} href={`#${e.id}`}>{e.titulo}</a>)}
      </nav>

      <div className="aux">
        {EMERGENCIAS.map((e) => (
          <section key={e.id} id={e.id} className="aux-card">
            <h2>{e.titulo}</h2>
            <ol>{e.pasos.map((p) => <Paso key={p} texto={p} />)}</ol>
          </section>
        ))}
      </div>

      <p className="muted" style={{ marginTop: "1.6rem", maxWidth: "70ch" }}>
        Última revisión: 3 de octubre de 2026. {AUTORIA && <>Elaborada por {AUTORIA}. </>}
        Esta guía es informativa y no es un diagnóstico.
      </p>
      <div className="actions">
        <Link className="btn" href="/rescate/nuevo">Reportar un animal en riesgo</Link>
        <Link className="btn ghost" href="/rescate">Ver casos que necesitan ayuda</Link>
      </div>
    </div>
  );
}
