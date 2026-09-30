import type { Metadata } from "next";
import Link from "next/link";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const display = Fredoka({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Huellitas HMO · Adopta y ayuda en Hermosillo",
  description:
    "Adopta, apadrina y dona en especie a los refugios de Hermosillo. Reporta mascotas perdidas o encontradas.",
};

function Paw() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <ellipse cx="16" cy="21" rx="7.5" ry="6" fill="#13284f" />
      <circle cx="6.5" cy="14" r="3" fill="#ffc933" />
      <circle cx="12" cy="8.5" r="3" fill="#ffc933" />
      <circle cx="20" cy="8.5" r="3" fill="#ffc933" />
      <circle cx="25.5" cy="14" r="3" fill="#ffc933" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="site">
          <div className="wrap">
            <Link href="/" className="brand"><Paw /> Huellitas HMO</Link>
            <nav aria-label="Principal">
              <Link href="/animales">Adopta</Link>
              <Link href="/animales?apadrinar=1">Apadrina</Link>
              <Link href="/donar">Dona</Link>
              <Link href="/adopta">Cómo adoptar</Link>
              <Link href="/reportes">Perdidos y encontrados</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site">
          <div className="wrap">
            <p><b>Huellitas HMO</b> · Proyecto ciudadano de Hermosillo, Sonora.</p>
            <p>
              No pedimos dinero: los donativos son en especie y se entregan directo al refugio.
              ¿Perdiste o encontraste una mascota? <Link href="/reportes/nuevo">Haz un reporte</Link>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
