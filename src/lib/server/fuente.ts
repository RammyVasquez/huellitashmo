// Descarga una fuente de Google Fonts (solo los caracteres que se usan) para dibujarla en las imágenes. Si falla, devuelve null y se usa la fuente por defecto.
export async function fuenteGoogle(familia: string, peso: number, texto: string): Promise<ArrayBuffer | null> {
  try {
    const letras = Array.from(new Set(texto.split(""))).join("");
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${familia}:wght@${peso}&text=${encodeURIComponent(letras)}`, { signal: AbortSignal.timeout(3500) })
    ).text();
    const m = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!m) return null;
    const res = await fetch(m[1], { signal: AbortSignal.timeout(3500) });
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}
