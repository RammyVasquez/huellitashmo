import Link from "next/link";
import Contacto, { CONTACT_EMAIL } from "./Contacto";

function Huella() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" aria-hidden="true">
      <ellipse cx="20" cy="27" rx="9" ry="7" fill="#ffc933" />
      <ellipse cx="7.5" cy="19" rx="3.6" ry="4.8" fill="#ffc933" />
      <ellipse cx="15" cy="10.5" rx="3.6" ry="5" fill="#ffc933" />
      <ellipse cx="25" cy="10.5" rx="3.6" ry="5" fill="#ffc933" />
      <ellipse cx="32.5" cy="19" rx="3.6" ry="4.8" fill="#ffc933" />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className="site sf">
      <div className="wrap">
        <div className="sf-cta">
          <div>
            <strong>¿Perdiste o encontraste una mascota?</strong>
            <span>Repórtalo en un par de minutos: sin crear cuenta y sin tener que dejar tu teléfono.</span>
          </div>
          <Link className="btn" href="/reportes/nuevo">Hacer un reporte</Link>
        </div>

        <div className="sf-cols">
          <div className="sf-brand">
            <div className="sf-logo"><Huella /><b>Huellitas HMO</b></div>
            <p>Proyecto ciudadano de Hermosillo, Sonora, para ayudar a perros y gatos y a quienes los rescatan.</p>
            <ul className="sf-promesas">
              <li>Gratis</li>
              <li>Sin publicidad</li>
              <li>No pedimos dinero</li>
            </ul>
            {CONTACT_EMAIL && <p className="sf-contacto"><Contacto prefijo="Escríbenos:" /></p>}
          </div>

          <nav aria-labelledby="sf-ayuda">
            <h2 id="sf-ayuda">Ayuda a un animal</h2>
            <ul>
              <li><Link href="/animales">Adopta</Link></li>
              <li><Link href="/animales?apadrinar=1">Apadrina</Link></li>
              <li><Link href="/donar">Dona en especie</Link></li>
              <li><Link href="/match">Encuentra tu match</Link></li>
              <li><Link href="/eventos">Eventos y jornadas</Link></li>
            </ul>
          </nav>

          <nav aria-labelledby="sf-necesito">
            <h2 id="sf-necesito">Si necesitas ayuda</h2>
            <ul>
              <li><Link href="/reportes/nuevo">Perdí o encontré una mascota</Link></li>
              <li><Link href="/rescate">Animal herido o maltratado</Link></li>
              <li><Link href="/primeros-auxilios">Primeros auxilios</Link></li>
              <li><Link href="/adopta">Cómo adoptar</Link></li>
            </ul>
          </nav>

          <nav aria-labelledby="sf-conocenos">
            <h2 id="sf-conocenos">Conócenos</h2>
            <ul>
              <li><Link href="/nosotros">Quiénes somos</Link></li>
              <li><Link href="/nosotros#sumarte">Cómo sumarte</Link></li>
              <li><Link href="/refugios">Refugios y rescatistas</Link></li>
              <li><Link href="/historias">Historias</Link></li>
              <li><Link href="/impacto">Impacto</Link></li>
            </ul>
          </nav>
        </div>

        <div className="sf-bottom">
          <span>© {new Date().getFullYear()} Huellitas HMO · Hecho con cariño en Hermosillo</span>
          <span>
            <Link href="/privacidad">Privacidad</Link> · <Link href="/reglas">Reglas de uso</Link> · <Link className="footer-admin" href="/admin">Acceso para administradores</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
