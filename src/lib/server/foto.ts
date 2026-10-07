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

export type FotoConMedidas = { uri: string; w: number; h: number };

function medidas(buf: Buffer, tipo: string): { w: number; h: number } | null {
  if (tipo.includes("png") && buf.length > 24) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m === 0xff) { i++; continue; }
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

// Igual que comoDataUri, pero también devuelve el ancho y alto para elegir el diseño según la foto (vertical u horizontal).
export async function fotoConMedidas(url: string): Promise<FotoConMedidas | null> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    const tipo = (res.headers.get("content-type") ?? "").split(";")[0];
    if (!res.ok || !/image\/(jpeg|png)/.test(tipo)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 2_500_000) return null;
    const m = medidas(buf, tipo);
    if (!m || !m.w || !m.h) return null;
    return { uri: `data:${tipo};base64,${buf.toString("base64")}`, ...m };
  } catch {
    return null;
  }
}
