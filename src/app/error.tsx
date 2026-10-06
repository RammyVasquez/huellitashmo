"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap page">
      <h1>Algo salió mal</h1>
      <p className="lead">Tuvimos un problema al cargar esta página. Puedes intentarlo de nuevo; si sigue fallando, vuelve en unos minutos.</p>
      <div className="actions">
        <button className="btn" onClick={reset}>Intentar de nuevo</button>
        <a className="btn ghost" href="/">Ir al inicio</a>
      </div>
    </div>
  );
}
