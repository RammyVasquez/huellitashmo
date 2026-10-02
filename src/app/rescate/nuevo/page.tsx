import RescueForm from "@/components/RescueForm";
import { supabase } from "@/lib/supabase";
import type { HelpContact } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reportar un animal en riesgo · Huellitas HMO" };

export default async function NuevoRescate() {
  const { data } = await supabase.from("help_contacts").select("*").order("sort").order("name");
  const contacts = (data ?? []) as HelpContact[];
  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Reportar un animal en riesgo</h1>
      <p className="lead">Herido, enfermo o maltratado: cuéntanos lo que viste. Puedes hacerlo sin dejar tus datos.</p>
      <div className="report-layout">
        <RescueForm contacts={contacts} />
        <aside className="tips" aria-label="Consejos">
          <div className="box">
            <h3>Cuida tu seguridad</h3>
            <ul>
              <li>No te pongas en riesgo ni te acerques si el animal está agresivo.</li>
              <li>Un animal herido puede morder por miedo o dolor.</li>
              <li>No lo muevas bruscamente si parece tener golpes graves.</li>
            </ul>
          </div>
          <div className="box">
            <h3>Qué ayuda más</h3>
            <ul>
              <li>La ubicación lo más exacta posible.</li>
              <li>Fotos o un video corto de su estado.</li>
              <li>Si es maltrato: describe hechos (qué, cuándo, dónde), sin nombrar ni acusar a nadie.</li>
            </ul>
          </div>
          <div className="box">
            <h3>Importante</h3>
            <p style={{ margin: 0 }}>Este reporte no es una denuncia legal ni sustituye a las autoridades. Nosotros lo revisamos y lo canalizamos.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
