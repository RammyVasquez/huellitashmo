// Descarga una foto con límite de tiempo y la convierte a data URI (solo JPG/PNG, máx. 1.5 MB). Si algo falla, devuelve null.
export async function comoDataUri(url: string): Promise<string | null> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    const tipo = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(jpeg|png)/.test(tipo)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 1_500_000) return null;
    return `data:${tipo.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
