import ReportForm from "@/components/ReportForm";

export const metadata = { title: "Reportar una mascota · Huellitas HMO" };

export default function NuevoReporte() {
  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Reportar una mascota</h1>
      <p className="lead">Cuéntanos qué pasó y lo compartimos con la comunidad. Tarda menos de 3 minutos.</p>
      <div className="report-layout">
        <ReportForm />
        <aside className="tips" aria-label="Consejos">
          <div className="box">
            <h3>Qué incluir</h3>
            <ul>
              <li>Fotos claras: de frente, de lado y de cualquier seña particular.</li>
              <li>Collar, manchas, cicatrices, tamaño y si responde a un nombre.</li>
              <li>La zona y, si la recuerdas, la hora en que se vio.</li>
            </ul>
          </div>
          <div className="box">
            <h3>Tu privacidad</h3>
            <ul>
              <li>Tu WhatsApp nunca se publica.</li>
              <li>Revisamos cada reporte antes de mostrarlo.</li>
              <li>De las mascotas encontradas solo mostramos una zona aproximada.</li>
            </ul>
          </div>
          <div className="box">
            <h3>Si encontraste una mascota</h3>
            <p style={{ margin: 0 }}>Guarda un detalle sin publicar (una marca, una cicatriz) para confirmar que quien la reclama es su dueño.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
