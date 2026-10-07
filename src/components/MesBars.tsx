import { MESES_CORTOS, techo } from "@/lib/graficas";

// Gráfica de barras por mes (SVG, sin JavaScript en el navegador) con tabla oculta para lectores de pantalla
export default function MesBars({ titulo, meses, valores }: { titulo: string; meses: string[]; valores: number[] }) {
  const total = valores.reduce((a, b) => a + b, 0);
  const max = techo(Math.max(0, ...valores));
  const W = 340, H = 196, x0 = 30, base = 150, alto = 118;
  const paso = (W - x0 - 8) / Math.max(1, valores.length);
  const bw = Math.min(18, paso * 0.62);

  return (
    <figure className="grafica">
      <figcaption>
        <b>{titulo}</b> <span className="muted">· total {total}</span>
      </figcaption>
      {total === 0 ? (
        <p className="muted vacio">Todavía sin datos: se llenará conforme haya actividad.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${titulo}: total ${total} en los últimos ${valores.length} meses`}>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={x0} x2={W - 8} y1={base - alto * f} y2={base - alto * f} stroke="#d5deed" strokeWidth="1" />
              <text x={x0 - 6} y={base - alto * f + 4} textAnchor="end" fontSize="10" fill="#51607c">{Math.round(max * f)}</text>
            </g>
          ))}
          {valores.map((v, i) => {
            const bx = x0 + i * paso + (paso - bw) / 2;
            const bh = (v / max) * alto;
            const [anio, mes] = [meses[i]?.slice(0, 4) ?? "", Number(meses[i]?.slice(5, 7))];
            return (
              <g key={meses[i] ?? i}>
                {v > 0 && <rect x={bx} y={base - bh} width={bw} height={bh} rx="3" fill="#13284f" />}
                {v > 0 && <text x={bx + bw / 2} y={base - bh - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#13284f">{v}</text>}
                <text x={bx + bw / 2} y={base + 15} textAnchor="middle" fontSize="9.5" fill="#51607c">{MESES_CORTOS[mes - 1] ?? ""}</text>
                {(mes === 1 || i === 0) && <text x={bx + bw / 2} y={base + 28} textAnchor="middle" fontSize="9" fill="#51607c">{anio}</text>}
              </g>
            );
          })}
        </svg>
      )}
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead><tr><th>Mes</th><th>Cantidad</th></tr></thead>
        <tbody>{valores.map((v, i) => <tr key={i}><td>{meses[i]?.slice(0, 7)}</td><td>{v}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
