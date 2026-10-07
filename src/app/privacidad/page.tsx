import Link from "next/link";
import Contacto, { CONTACT_EMAIL } from "@/components/Contacto";

export const metadata = { title: "Aviso de privacidad · Huellitas HMO" };

const RESPONSABLE = "Ramses Urquijo";

export default function Privacidad() {
  return (
    <div className="wrap page prose">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Aviso de privacidad</h1>
      <p className="updated">Última actualización: 3 de octubre de 2026</p>
      <p className="lead">
        Huellitas HMO recibe pocos datos personales y solo los usa para ayudar a animales. Aquí explicamos cuáles, para qué y quién los ve.
      </p>

      <h2>1. Quién es el responsable</h2>
      <p>
        Huellitas HMO es un proyecto ciudadano de Hermosillo, Sonora, operado por {RESPONSABLE}.{" "}
        {CONTACT_EMAIL ? <Contacto prefijo="Para cualquier duda o solicitud sobre tus datos escribe a" />  : "Puedes ponerte en contacto con nosotros por medio de los refugios que participan en el sitio."}
      </p>

      <h2>2. Qué datos recibimos y para qué</h2>
      <ul>
        <li><b>Reportes de mascotas perdidas o encontradas:</b> tipo, especie, descripción, colonia, ubicación en el mapa (opcional), fotos y tu número de WhatsApp. Sirven para publicar el caso y que quien reconozca al animal pueda contactarte.</li>
        <li><b>Reportes de animales heridos, enfermos o maltratados:</b> los mismos datos, con tu WhatsApp <b>opcional</b>. Sirven para que nuestro equipo los revise y los canalice con quien pueda ayudar.</li>
        <li><b>Datos de refugios:</b> nombre, logo, dirección, teléfono y redes, publicados con autorización del refugio.</li>
        <li><b>Solicitudes de adopción:</b> nombre, WhatsApp, colonia y datos de tu hogar (tipo de vivienda, personas, niños, otros animales y experiencia). Se envían solo al equipo administrador y al refugio responsable del animal para evaluar tu solicitud. Nunca se publican.</li>
        <li><b>Padrinos:</b> los refugios anotan el nombre o apodo de quien apadrina a un animal, lo que cubre y, si la persona lo da, su contacto. Esos datos son privados: en el sitio solo se muestra cuántos padrinos tiene un animal.</li>
        <li><b>Historias “Encontró hogar”:</b> solo se publican con la autorización de la familia y de la forma en que la dé (con o sin su nombre). Puedes pedir que se retire en cualquier momento.</li>
        <li><b>Seguimiento después de la adopción:</b> si adoptas, podemos enviarte por WhatsApp una liga para que nos cuentes cómo va tu mascota y, si quieres, envíes fotos. Las fotos solo se usan en publicaciones o historias si lo autorizas expresamente.</li>
        <li><b>Personal autorizado (administradores, moderadores y personal de refugios):</b> correo y contraseña, gestionados por el servicio de autenticación de Supabase. Cada persona solo accede a lo que le corresponde: por ejemplo, el personal de un refugio solo ve los animales de su refugio y las solicitudes de adopción de esos animales.</li>
      </ul>
      <p>No pedimos cuentas a quienes visitan el sitio y no vendemos ni cedemos datos para publicidad.</p>

      <h2>3. Qué se publica y qué no</h2>
      <ul>
        <li><b>Tu WhatsApp nunca se publica.</b> Quien quiera contactarte lo hace con un botón que abre WhatsApp sin mostrar tu número en la página.</li>
        <li>Cada reporte se <b>revisa antes</b> de aparecer en el sitio.</li>
        <li><b>Ubicación aproximada:</b> en mascotas perdidas se muestra con precisión de unos 100 metros; en las encontradas, de aproximadamente 1 kilómetro.</li>
        <li><b>Maltrato, abandono, encierro y otras situaciones que involucran a personas o domicilios no se publican nunca.</b> Solo los ve el equipo administrador. De los animales heridos o enfermos en la calle se publica una ubicación aproximada, sin teléfono.</li>
        <li>Las fotos se guardan con una dirección web larga e impredecible. Aunque un reporte no se publique, técnicamente quien tuviera la dirección exacta de una foto podría abrirla.</li>
      </ul>

      <h2>4. Con quién se comparten (proveedores del servicio)</h2>
      <p>Para funcionar usamos servicios de terceros, que pueden almacenar o procesar datos fuera de México:</p>
      <ul>
        <li><b>Supabase:</b> base de datos, autenticación y almacenamiento de fotos.</li>
        <li><b>Vercel:</b> alojamiento del sitio.</li>
        <li><b>Cloudflare Turnstile:</b> verificación anti-bots al enviar un reporte.</li>
        <li><b>Telegram y, en su caso, un servicio de correo:</b> avisan al administrador de que llegó un reporte. Los avisos <b>no incluyen teléfonos ni el texto del reporte</b>, solo el tipo, la especie y la zona.</li>
        <li><b>OpenStreetMap (mapas, Nominatim y Overpass):</b> muestran los mapas y buscan direcciones. Cuando buscas una dirección, el texto que escribes se envía a estos servicios.</li>
        <li><b>El refugio responsable del animal</b> que quieres adoptar recibe los datos de tu solicitud para evaluarla.</li>
        <li><b>WhatsApp:</b> cuando pulsas un botón para escribir a alguien, tu conversación se rige por las condiciones de WhatsApp.</li>
        <li><b>Facebook:</b> solo si pulsas “Ver sus publicaciones” en el perfil de un refugio; no se carga nada de Facebook antes.</li>
        <li><b>Panel de administración:</b> la comparación de fotos corre en el navegador del administrador. La librería y el modelo se descargan de jsDelivr y Hugging Face; las fotos no se envían a ningún servicio de inteligencia artificial.</li>
      </ul>

      <h2>5. Tu ubicación</h2>
      <p>
        Si pulsas “Usar mi ubicación” o “Ver lo más cercano a mí”, tu navegador te pide permiso. La ubicación se usa en tu dispositivo para ordenar resultados o marcar el mapa; <b>solo se guarda si la incluyes en un reporte</b>.
      </p>

      <h2>6. Cookies y almacenamiento</h2>
      <p>
        No usamos cookies de publicidad ni de análisis. El panel de administración usa el almacenamiento del navegador para mantener la sesión. La verificación de Cloudflare y los contenidos incrustados, como Facebook, pueden usar sus propias cookies.
      </p>

      <h2>7. Cuánto tiempo conservamos tus datos</h2>
      <p>
        Conservamos los reportes mientras sirvan para ayudar al animal y para llevar el registro de resultados del proyecto. Si nos pides que borremos tu reporte y tus datos de contacto, lo haremos.
      </p>

      <h2>8. Tus derechos</h2>
      <p>
        Puedes pedirnos acceder a tus datos, corregirlos, borrarlos u oponerte a su uso.{" "}
        {CONTACT_EMAIL ? <Contacto prefijo="Escríbenos a" /> : "Escríbenos por medio de los refugios que participan en el sitio."} e indica el reporte al que te refieres.
      </p>

      <h2>9. Menores de edad</h2>
      <p>El sitio no está dirigido a menores de edad. Si eres menor, usa el sitio con ayuda de una persona adulta.</p>

      <h2>10. Cambios a este aviso</h2>
      <p>Si cambiamos este aviso, actualizaremos la fecha de arriba. Consulta también las <Link href="/reglas">reglas de uso</Link>.</p>
    </div>
  );
}
