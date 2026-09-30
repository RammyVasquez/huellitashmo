import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fredoka, Nunito } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const display = Fredoka({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Huellitas HMO · Adopta y ayuda en Hermosillo",
  description:
    "Adopta, apadrina y dona en especie a los refugios de Hermosillo. Reporta mascotas perdidas o encontradas.",
  openGraph: { siteName: "Huellitas HMO", locale: "es_MX", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#13284f",
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
            <SiteNav />
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
            <p className="footer-admin"><Link href="/admin">Acceso para administradores</Link></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
