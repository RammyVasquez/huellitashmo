import Link from "next/link";
import RecuperarForm from "@/components/RecuperarForm";

export const metadata = { title: "Recuperar contraseña · Huellitas HMO", robots: { index: false, follow: false } };

export default function Recuperar() {
  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Recuperar mi contraseña</h1>
      <p className="lead">Escribe el correo con el que entras al panel y te mandamos un enlace para crear una nueva.</p>
      <RecuperarForm />
      <p><Link href="/admin">← Volver al acceso</Link></p>
    </div>
  );
}
