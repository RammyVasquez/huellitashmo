import RestablecerForm from "@/components/RestablecerForm";

export const metadata = { title: "Contraseña nueva · Huellitas HMO", robots: { index: false, follow: false } };

export default function Restablecer() {
  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Crea tu contraseña nueva</h1>
      <RestablecerForm />
    </div>
  );
}
