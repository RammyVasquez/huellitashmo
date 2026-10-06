import Link from "next/link";
import Contacto from "@/components/Contacto";

export const metadata = { title: "Reglas de uso · Huellitas HMO" };

export default function Reglas() {
  return (
    <div className="wrap page prose">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Reglas de uso</h1>
      <p className="updated">Última actualización: 2 de octubre de 2026</p>
      <p className="lead">Huellitas HMO existe para ayudar a animales de Hermosillo. Estas reglas protegen a los animales, a los refugios y a las personas que usan el sitio.</p>

      <h2>Qué es y qué no es</h2>
      <ul>
        <li>Es una plataforma <b>gratuita</b> que conecta a personas con refugios y con otras personas.</li>
        <li><b>No es un servicio de emergencia</b> ni una autoridad, y no responde al instante. Si un animal está grave, busca un veterinario o a la autoridad local.</li>
        <li>Un reporte aquí <b>no es una denuncia legal</b>. Si quieres denunciar maltrato, hazlo ante las autoridades.</li>
      </ul>

      <h2>Si haces un reporte</h2>
      <ul>
        <li>Cuenta solo hechos verdaderos. Los reportes falsos se eliminan.</li>
        <li>Usa fotos propias o con permiso de quien las tomó.</li>
        <li>No incluyas datos personales de terceros ni acuses a nadie por su nombre: describe lo que viste.</li>
        <li>Un reporte por caso. Si el caso se resuelve, avísanos para cerrarlo.</li>
      </ul>

      <h2>Qué podemos hacer</h2>
      <p>Revisamos los reportes antes de publicarlos y podemos editarlos, retirarlos o rechazarlos, especialmente si incumplen estas reglas, ponen en riesgo a alguien o parecen spam.</p>

      <h2>Adopciones, apadrinamientos y donativos</h2>
      <ul>
        <li>La decisión de entregar un animal en adopción es del <b>refugio</b>, que puede pedir requisitos propios.</li>
        <li>La plataforma <b>no cobra ni maneja dinero</b>. Los donativos y el apadrinamiento son en especie y se coordinan directo con el refugio.</li>
        <li>No es un espacio para vender animales.</li>
      </ul>

      <h2>Cuando una mascota perdida aparece</h2>
      <p>Antes de entregar a un animal, quien lo encontró debe confirmar que la otra persona es su dueña, por ejemplo con un detalle que no se publicó en el reporte. La plataforma no resuelve disputas entre personas.</p>

      <h2>Límites de la plataforma</h2>
      <p>Es un proyecto ciudadano. La información la aportan las personas y los refugios; revisamos lo que podemos, pero puede haber errores. Los acuerdos que hagas con otras personas son responsabilidad de las partes.</p>

      <p>
        Consulta el <Link href="/privacidad">aviso de privacidad</Link>. <Contacto prefijo="Contacto:" />
      </p>
    </div>
  );
}
