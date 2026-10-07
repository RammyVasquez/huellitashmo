import type { MetadataRoute } from "next";

// Permite agregar el sitio a la pantalla de inicio del celular
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Huellitas HMO",
    short_name: "Huellitas",
    description: "Adopta, apadrina y ayuda a los animales de Hermosillo.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#13284f",
    lang: "es-MX",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Reportar una mascota", url: "/reportes/nuevo" },
      { name: "Emergencia", url: "/primeros-auxilios" },
    ],
  };
}
