import { partesFecha } from "@/lib/eventos";

// Cuadro de fecha tipo calendario
export default function EventoFecha({ iso }: { iso: string }) {
  const f = partesFecha(iso);
  return (
    <div className="ev-fecha" aria-hidden="true">
      <span className="dia">{f.dia}</span>
      <span className="mes">{f.mes}</span>
      <span className="sem">{f.semana}</span>
    </div>
  );
}
