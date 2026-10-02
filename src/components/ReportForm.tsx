"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { comprimirImagen } from "@/lib/upload";
import { errTexto, normalizeWa } from "@/lib/util";
import type { Pos } from "@/lib/geo";
import type { Focus } from "./LocationPicker";
import Turnstile, { CAPTCHA_ACTIVO } from "./Turnstile";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <div className="map-box small" aria-hidden="true" />,
});

const MAX_FOTOS = 5;
type Foto = { id: string; file: File; preview: string };
type Kind = "perdido" | "encontrado";
type Species = "perro" | "gato" | "otro";

export default function ReportForm() {
  const [kind, setKind] = useState<Kind>("perdido");
  const [species, setSpecies] = useState<Species>("perro");
  const [zona, setZona] = useState("");
  const [loc, setLoc] = useState<Pos | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [avisoFotos, setAvisoFotos] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [avisoMapa, setAvisoMapa] = useState("");
  const [ultimaBusqueda, setUltimaBusqueda] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [mensaje, setMensaje] = useState("");
  const [token, setToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  useEffect(() => () => fotosRef.current.forEach((f) => URL.revokeObjectURL(f.preview)), []);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevos = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    e.target.value = ""; // permite volver a elegir la misma foto
    const espacio = MAX_FOTOS - fotos.length;
    setAvisoFotos(nuevos.length > espacio ? `Puedes subir hasta ${MAX_FOTOS} fotos.` : "");
    const tomar = nuevos.slice(0, Math.max(0, espacio));
    setFotos((f) => [...f, ...tomar.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))]);
  }

  function quitarFoto(id: string) {
    setFotos((f) => {
      f.filter((x) => x.id === id).forEach((x) => URL.revokeObjectURL(x.preview));
      return f.filter((x) => x.id !== id);
    });
    setAvisoFotos("");
  }

  // Busca la colonia en OpenStreetMap (Nominatim) y centra el mapa ahí. Solo cuando la persona lo pide.
  async function buscarZona() {
    const texto = zona.trim();
    if (texto.length < 3) return;
    setBuscando(true);
    setAvisoMapa("");
    setUltimaBusqueda(texto);
    try {
      const params = new URLSearchParams({
        q: `${texto}, Hermosillo, Sonora, México`,
        format: "jsonv2",
        limit: "1",
        countrycodes: "mx",
        viewbox: "-111.2,29.3,-110.7,28.9",
        "accept-language": "es",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
      const data = (await res.json()) as { lat: string; lon: string }[];
      const lat = parseFloat(data[0]?.lat), lng = parseFloat(data[0]?.lon);
      const dentro = lat > 28.7 && lat < 29.5 && lng > -111.4 && lng < -110.6;
      if (!data.length || Number.isNaN(lat) || !dentro) {
        setAvisoMapa("No encontramos esa zona en el mapa. Toca el mapa para marcar el lugar.");
      } else {
        setLoc({ lat, lng });
        setFocus({ lat, lng, zoom: 15, n: Date.now() });
        setAvisoMapa("Marcamos la zona de forma aproximada. Arrastra el pin o toca el mapa para ajustarlo.");
      }
    } catch {
      setAvisoMapa("No pudimos buscar la zona ahora. Toca el mapa para marcar el lugar.");
    }
    setBuscando(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const wa = normalizeWa(String(fd.get("whatsapp")));
    if (!wa || wa.length < 12) {
      setEstado("error");
      setMensaje("Escribe tu WhatsApp con 10 dígitos (ej. 6621234567).");
      return;
    }
    if (CAPTCHA_ACTIVO && !token) {
      setEstado("error");
      setMensaje("Completa la verificación de seguridad.");
      return;
    }
    setEstado("enviando");
    setMensaje(fotos.length ? "Subiendo fotos…" : "");
    try {
      const body = new FormData();
      body.set("kind", kind);
      body.set("species", species);
      body.set("description", String(fd.get("description")).trim());
      body.set("zone", zona.trim());
      body.set("whatsapp", wa);
      if (loc) { body.set("lat", String(loc.lat)); body.set("lng", String(loc.lng)); }
      body.set("token", token);
      body.set("website", String(fd.get("website") ?? ""));
      const blobs = await Promise.all(fotos.map((f) => comprimirImagen(f.file, 1400, "image/jpeg")));
      if (blobs.reduce((n, b) => n + b.size, 0) > 4_000_000) throw new Error("Las fotos pesan demasiado. Quita alguna e intenta de nuevo.");
      blobs.forEach((b, i) => body.append("fotos", b, `foto-${i + 1}.jpg`));
      const res = await fetch("/api/reportes", { method: "POST", body });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error ?? "No pudimos enviar el reporte.");
      fotos.forEach((f) => URL.revokeObjectURL(f.preview));
      setEstado("ok");
    } catch (err) {
      console.error(err);
      setEstado("error");
      setMensaje(`No pudimos enviar tu reporte: ${errTexto(err)}`);
      setToken("");
      setCaptchaKey((k) => k + 1);
    }
  }

  function reiniciar() {
    setKind("perdido"); setSpecies("perro"); setZona(""); setLoc(null); setFocus(null);
    setFotos([]); setAvisoMapa(""); setUltimaBusqueda(""); setMensaje(""); setEstado("idle");
  }

  if (estado === "ok")
    return (
      <div className="form-card success" role="status">
        <h2>¡Gracias por avisar!</h2>
        <p className="lead">Revisaremos tu reporte y lo publicaremos pronto. Mientras tanto, comparte tu caso con tus vecinos y en los grupos de tu colonia.</p>
        <div className="actions">
          <Link className="btn" href="/reportes">Ver perdidos y encontrados</Link>
          <button className="btn ghost" onClick={reiniciar}>Hacer otro reporte</button>
        </div>
      </div>
    );

  const Opcion = ({ activo, onClick, titulo, texto, name }: { activo: boolean; onClick: () => void; titulo: string; texto?: string; name: string }) => (
    <label className={`choice${activo ? " on" : ""}`}>
      <input type="radio" name={name} checked={activo} onChange={onClick} />
      <strong>{titulo}</strong>
      {texto && <span>{texto}</span>}
    </label>
  );

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <section className="fs">
        <h2><span className="num">1</span> ¿Qué pasó?</h2>
        <div className="choices">
          <Opcion name="kind" activo={kind === "perdido"} onClick={() => setKind("perdido")} titulo="Perdí a mi mascota" texto="Quiero que me ayuden a encontrarla" />
          <Opcion name="kind" activo={kind === "encontrado"} onClick={() => setKind("encontrado")} titulo="Encontré una mascota" texto="Quiero ayudar a que vuelva a casa" />
        </div>
      </section>

      <section className="fs">
        <h2><span className="num">2</span> Cuéntanos sobre el animal</h2>
        <div className="choices three" role="radiogroup" aria-label="Tipo de animal">
          <Opcion name="species" activo={species === "perro"} onClick={() => setSpecies("perro")} titulo="Perro" />
          <Opcion name="species" activo={species === "gato"} onClick={() => setSpecies("gato")} titulo="Gato" />
          <Opcion name="species" activo={species === "otro"} onClick={() => setSpecies("otro")} titulo="Otro" />
        </div>
        <label>Descripción (color, tamaño, collar, señas particulares)
          <textarea name="description" rows={4} required />
        </label>

        <div>
          <b>Fotos <span className="muted" style={{ fontWeight: 400 }}>(hasta {MAX_FOTOS}; de frente, de lado y su seña particular)</span></b>
          <div className="previews">
            {fotos.map((f, i) => (
              <div className="preview" key={f.id}>
                <img src={f.preview} alt={`Vista previa de la foto ${i + 1}`} />
                <button type="button" className="preview-x" aria-label={`Quitar foto ${i + 1}`} onClick={() => quitarFoto(f.id)}>×</button>
              </div>
            ))}
            {fotos.length < MAX_FOTOS && (
              <label className="add-photo">
                <input type="file" accept="image/*" multiple onChange={onFiles} />
                <span aria-hidden="true">+</span>
                <small>Agregar fotos</small>
              </label>
            )}
          </div>
          {avisoFotos && <p className="error" role="alert" style={{ margin: ".4rem 0 0" }}>{avisoFotos}</p>}
        </div>
      </section>

      <section className="fs">
        <h2><span className="num">3</span> ¿Dónde fue?</h2>
        <label>Colonia o zona
          <div className="row">
            <input
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              onBlur={() => { if (!loc && zona.trim().length > 2 && zona.trim() !== ultimaBusqueda) buscarZona(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscarZona(); } }}
              placeholder="Ej. Colonia Pitic"
              required
            />
            <button type="button" className="btn ghost" onClick={buscarZona} disabled={buscando || zona.trim().length < 3}>
              {buscando ? "Buscando…" : "Buscar en el mapa"}
            </button>
          </div>
        </label>
        {avisoMapa && <p className="muted" role="status" style={{ margin: "-.4rem 0 .2rem" }}>{avisoMapa}</p>}
        <p className="muted" style={{ margin: 0, fontSize: ".95rem" }}>
          Marcar el lugar exacto es opcional, pero ayuda mucho.
          {kind === "encontrado" && " Por seguridad, de las mascotas encontradas solo mostramos una zona aproximada."}
        </p>
        <LocationPicker value={loc} onChange={setLoc} focus={focus} />
      </section>

      <section className="fs">
        <h2><span className="num">4</span> ¿Cómo te contactan?</h2>
        <label>Tu WhatsApp (10 dígitos)
          <input name="whatsapp" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="6621234567" required />
        </label>
        <p className="muted" style={{ margin: 0, fontSize: ".95rem" }}>Tu número nunca se publica: la gente te escribe desde un botón.</p>
      </section>

      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <Turnstile onToken={setToken} resetKey={captchaKey} />
      <button className="btn big" disabled={estado === "enviando" || (CAPTCHA_ACTIVO && !token)}>
        {estado === "enviando" ? mensaje || "Enviando…" : "Enviar reporte"}
      </button>
      {estado === "error" && <p className="error" role="alert">{mensaje}</p>}
    </form>
  );
}
