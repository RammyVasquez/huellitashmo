import Link from "next/link";
import Contacto, { CONTACT_EMAIL } from "@/components/Contacto";

export const metadata = {
  title: "Quiénes somos y cómo sumarte · Huellitas HMO",
  description: "Quién está detrás de Huellitas HMO, por qué es gratis y cómo pueden sumarse refugios, hogares temporales y rescatistas de Hermosillo.",
};

export default function Nosotros() {
  return (
    <div className="wrap page prose">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Quiénes somos y cómo sumarte</h1>
      <p className="lead">
        Huellitas HMO es una plataforma gratuita, hecha en Hermosillo, para ayudar a perros y gatos y a las personas que los rescatan.
      </p>

      <h2>Quién está detrás</h2>
      <p>
        La desarrolla y la mantiene <b>Ramses Urquijo</b>, ingeniero en sistemas de Hermosillo, como un proyecto independiente de servicio a la comunidad.
        Se construye de la mano de refugios, hogares temporales y rescatistas de la ciudad, que ayudan a probarla y a mejorarla.
      </p>
      <p>No es un refugio ni una dependencia de gobierno: es una herramienta para quienes sí hacen el rescate.</p>

      <h2>Por qué es gratis</h2>
      <p>
        Usa servicios gratuitos y el tiempo de quien la mantiene. <b>No cobra</b> a refugios ni a familias, <b>no vende datos</b> y <b>no muestra publicidad</b>.
        Tampoco maneja dinero: los donativos son en especie y se entregan directo a quien los recibe.
      </p>

      <h2>Lo que Huellitas HMO no es</h2>
      <ul>
        <li>No es un servicio de emergencia: si un animal está grave, llama a una veterinaria o a la autoridad.</li>
        <li>No decide las adopciones: cada refugio o rescatista elige a quién se los da.</li>
        <li>No certifica a nadie: el sello “Verificado” solo dice que comprobamos quién es y que rescata en Hermosillo.</li>
      </ul>

      <section id="sumarte">
        <h2>Cómo sumarte</h2>
        <p>
          Puedes sumarte como <b>refugio</b>, <b>hogar temporal</b>, <b>rescatista independiente</b> o <b>colectivo de rescate</b>.
          No necesitas instalaciones: basta con que cuides animales en Hermosillo, aunque sea con pocos recursos o poco tiempo.
        </p>
        <ol>
          <li><b>Escríbenos</b> y cuéntanos qué haces y cuántos animales tienes.</li>
          <li><b>Verificamos quién eres</b>: platicamos, conocemos a tus animales y revisamos tus redes.</li>
          <li><b>Creamos tu perfil y tu acceso</b> y te damos una guía sencilla.</li>
          <li><b>Publicas a tus animales</b> y recibes solicitudes ordenadas. Si ya tienes tu lista en Excel, la importamos juntos.</li>
        </ol>
        <div className="box">
          <h3 style={{ marginTop: 0 }}>Lo que te pedimos</h3>
          <ul style={{ margin: 0 }}>
            <li>Información honesta sobre la salud y el carácter de cada animal.</li>
            <li>Cuidar los datos de las familias que quieren adoptar.</li>
            <li>No pedir dinero a través de la plataforma.</li>
            <li>Avisar cuando un animal ya no esté disponible.</li>
          </ul>
        </div>
        <p>
          <b>Tu casa sigue siendo tuya.</b> Si recibes animales en tu domicilio, no hace falta publicar tu dirección: la gente te escribe por WhatsApp y acuerdan la entrega.
        </p>
      </section>

      <h2>Qué significa “Verificado”</h2>
      <p>
        Es un sello que pone el equipo después de confirmar la identidad de la persona o del refugio y de ver su labor de rescate. Ayuda a las familias a decidir con más confianza,
        pero no sustituye una entrevista ni una visita antes de adoptar. Puedes ver las definiciones y cifras en <Link href="/impacto">Impacto</Link>.
      </p>

      <h2>Si no tienes animales, también puedes ayudar</h2>
      <ul>
        <li><Link href="/donar">Dona</Link> alimento, cobijas o medicinas directo a un refugio.</li>
        <li><Link href="/animales?apadrinar=1">Apadrina</Link> a un animal en especie.</li>
        <li><Link href="/reportes/nuevo">Reporta</Link> una mascota perdida o encontrada, o <Link href="/rescate/nuevo">un animal en riesgo</Link>.</li>
        <li>Comparte el sitio con tus vecinos y tus grupos.</li>
      </ul>

      <h2>Instálala en tu celular</h2>
      <p>Puedes tener Huellitas HMO como un ícono en tu pantalla de inicio, sin descargar nada de una tienda:</p>
      <ul>
        <li><b>Android (Chrome):</b> menú ⋮ → “Instalar app” o “Agregar a la pantalla de inicio”.</li>
        <li><b>iPhone (Safari):</b> botón Compartir → “Agregar a inicio”.</li>
      </ul>

      <h2>Contacto</h2>
      <p>
        {CONTACT_EMAIL ? <Contacto prefijo="Escríbenos a" /> : "Pronto habilitaremos un correo de contacto."} Si eres refugio, hogar temporal o rescatista, cuéntanos brevemente quién eres y qué haces.
      </p>
    </div>
  );
}
