import ReportForm from "@/components/ReportForm";

export default function NuevoReporte() {
  return (
    <>
      <h1>Reportar una mascota</h1>
      <p className="lead">Tu reporte se revisa antes de publicarse para evitar spam y fraudes.</p>
      <ReportForm />
    </>
  );
}
