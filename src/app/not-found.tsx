import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap page">
      <h1>Esta huellita se perdió</h1>
      <p className="lead">No encontramos la página que buscas. Puede que el animal ya haya sido adoptado o que la liga esté incompleta.</p>
      <div className="actions">
        <Link className="btn" href="/animales">Ver animales en adopción</Link>
        <Link className="btn ghost" href="/">Ir al inicio</Link>
      </div>
    </div>
  );
}
