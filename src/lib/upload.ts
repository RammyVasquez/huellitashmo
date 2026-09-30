import { supabase } from "@/lib/supabase";

// Reduce la foto antes de subirla (fotos de celular de 4-8 MB -> ~200 KB) para cuidar el espacio gratuito.
async function shrink(file: File, maxSide: number, mime: "image/jpeg" | "image/png") {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new Error("No se pudo leer la imagen. Prueba con una foto JPG o PNG.");
  }
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo procesar la imagen."))), mime, 0.82)
  );
}

export async function uploadPhoto(file: File, folder: "animales" | "logos"): Promise<string> {
  const isLogo = folder === "logos"; // los logos conservan transparencia (PNG)
  const mime = isLogo ? "image/png" : "image/jpeg";
  const blob = await shrink(file, isLogo ? 512 : 1400, mime);
  const path = `${folder}/${crypto.randomUUID()}.${isLogo ? "png" : "jpg"}`;
  const { error } = await supabase.storage.from("fotos").upload(path, blob, { contentType: mime });
  if (error) throw error;
  return supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
}
