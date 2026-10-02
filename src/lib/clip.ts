// Compara fotos con CLIP corriendo EN EL NAVEGADOR del administrador (sin servidor ni costo).
// La librería se carga desde un CDN con versión fija: empaquetarla dentro de Next.js 14 no compila.
const LIB = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
const MODELO = "Xenova/clip-vit-base-patch32";

type Cargado = { processor: any; model: any; RawImage: any };
let cargado: Promise<Cargado> | null = null;

export function cargarModelo(onProgress?: (pct: number) => void): Promise<Cargado> {
  if (!cargado) {
    cargado = (async () => {
      const lib: any = await import(/* webpackIgnore: true */ LIB);
      lib.env.allowLocalModels = false;
      const processor = await lib.AutoProcessor.from_pretrained(MODELO);
      const model = await lib.CLIPVisionModelWithProjection.from_pretrained(MODELO, {
        dtype: "q8",
        progress_callback: (p: any) => {
          if (p?.status === "progress" && typeof p.progress === "number") onProgress?.(Math.round(p.progress));
        },
      });
      return { processor, model, RawImage: lib.RawImage };
    })().catch((e) => {
      cargado = null; // permite reintentar
      throw e;
    });
  }
  return cargado;
}

// Devuelve el vector normalizado de una foto (512 números)
export async function vectorDeFoto(url: string): Promise<number[]> {
  const { processor, model, RawImage } = await cargarModelo();
  const image = await RawImage.read(url);
  const inputs = await processor(image);
  const { image_embeds } = await model(inputs);
  const v = Array.from(image_embeds.data as Float32Array);
  const norm = Math.hypot(...v) || 1;
  return v.map((x) => Math.round((x / norm) * 1e5) / 1e5);
}

// Vectores normalizados: el producto punto es la similitud coseno
export function similitud(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
