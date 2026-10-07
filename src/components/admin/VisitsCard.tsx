"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { errTexto } from "@/lib/util";

type Fila = { day: string; source: string; visits: number };
const hoyHmo = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Hermosillo" });
const hace = (dias: number) => { const d = new Date(`${hoyHmo()}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - dias); return d.toISOString().slice(0, 10); };

const NOMBRES: Record<string, string> = { directo: "Directo (escribieron la dirección)", otro_sitio: "Otro sitio web", otro: "Otro" };

export default function VisitsCard() {
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("visits_daily").select("day, source, visits").gte("day", hace(89)).limit(5000)
      .then(({ data, error: e }) => { if (e) setError(errTexto(e)); else setFilas((data ?? []) as Fila[]); });
  }, []);

  if (error) return <p className="error">No se pudieron cargar las visitas: {error}</p>;
  if (!filas) return <p className="muted">Cargando visitas…</p>;

  const c7 = hace(6), c30 = hace(29);
  const por = new Map<string, { s7: number; s30: number; s90: number }>();
  for (const f of filas) {
    const a = por.get(f.source) ?? { s7: 0, s30: 0, s90: 0 };
    a.s90 += f.visits;
    if (f.day >= c30) a.s30 += f.visits;
    if (f.day >= c7) a.s7 += f.visits;
    por.set(f.source, a);
  }
  const lista = [...por.entries()].sort((a, b) => b[1].s30 - a[1].s30 || b[1].s90 - a[1].s90);
  const total = lista.reduce((t, [, v]) => ({ s7: t.s7 + v.s7, s30: t.s30 + v.s30, s90: t.s90 + v.s90 }), { s7: 0, s30: 0, s90: 0 });

  return (
    <>
      <h2 style={{ marginTop: "2.5rem" }}>De dónde llegan las visitas</h2>
      <p className="muted" style={{ maxWidth: "65ch" }}>
        Cuenta una visita por sesión del navegador, sin cookies y sin identificar a nadie: es una cifra aproximada de visitas, no de personas distintas.
        Las ligas con <code>?ref=vecinos</code>, <code>?ref=cartel</code> o <code>?ref=kit</code> aparecen con ese nombre. Para que tus propias visitas no cuenten, abre una vez <code>/?nocontar=1</code> en cada dispositivo.
      </p>
      {lista.length === 0 ? (
        <div className="empty">Todavía no hay visitas registradas.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="tabla">
            <thead><tr><th>Origen</th><th>7 días</th><th>30 días</th><th>90 días</th></tr></thead>
            <tbody>
              {lista.map(([s, v]) => <tr key={s}><td>{NOMBRES[s] ?? s}</td><td>{v.s7}</td><td>{v.s30}</td><td>{v.s90}</td></tr>)}
              <tr><td><b>Total</b></td><td><b>{total.s7}</b></td><td><b>{total.s30}</b></td><td><b>{total.s90}</b></td></tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
