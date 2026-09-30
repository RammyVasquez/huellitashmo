"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReportForm() {
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [mensaje, setMensaje] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setEstado("enviando");
    try {
      let photo_url: string | null = null;
      const file = fd.get("foto") as File;
      if (file && file.size > 0) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `reportes/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("fotos").upload(path, file);
        if (up.error) throw up.error;
        photo_url = supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("reports").insert({
        kind: fd.get("kind"),
        species: fd.get("species"),
        description: fd.get("description"),
        zone: fd.get("zone"),
        contact_whatsapp: String(fd.get("whatsapp")).replace(/\D/g, ""),
        photo_url,
        // TODO semana 2: lat/lng desde el mapa Leaflet
        status: "pendiente",
      });
      if (error) throw error;
      form.reset();
      setEstado("ok");
      setMensaje("¡Gracias! Revisaremos tu reporte y lo publicaremos pronto.");
    } catch (err) {
      setEstado("error");
      setMensaje("No pudimos enviar tu reporte. Revisa los datos e intenta de nuevo.");
      console.error(err);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label>¿Qué pasó?
        <select name="kind" required>
          <option value="perdido">Perdí a mi mascota</option>
          <option value="encontrado">Encontré una mascota</option>
        </select>
      </label>
      <label>Tipo de animal
        <select name="species" required>
          <option value="perro">Perro</option>
          <option value="gato">Gato</option>
          <option value="otro">Otro</option>
        </select>
      </label>
      <label>Descripción (color, tamaño, collar, señas)
        <textarea name="description" rows={4} required />
      </label>
      <label>Colonia o zona
        <input name="zone" required />
      </label>
      <label>Foto
        <input name="foto" type="file" accept="image/*" />
      </label>
      <label>Tu WhatsApp (no se muestra públicamente)
        <input name="whatsapp" inputMode="numeric" placeholder="5216621234567" required />
      </label>
      <button className="btn" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando…" : "Enviar reporte"}
      </button>
      {estado === "ok" && <p className="ok">{mensaje}</p>}
      {estado === "error" && <p className="error">{mensaje}</p>}
    </form>
  );
}
