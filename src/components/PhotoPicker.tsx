"use client";
import { useEffect, useRef, useState } from "react";

type Foto = { id: string; file: File; preview: string };

// Elige varias fotos con vista previa. Entrega la lista de archivos con onChange.
export default function PhotoPicker({ max = 5, onChange }: { max?: number; onChange: (files: File[]) => void }) {
  const [items, setItems] = useState<Foto[]>([]);
  const [aviso, setAviso] = useState("");
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => () => itemsRef.current.forEach((f) => URL.revokeObjectURL(f.preview)), []);
  useEffect(() => { onChangeRef.current(items.map((i) => i.file)); }, [items]);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevos = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    const espacio = max - items.length;
    setAviso(nuevos.length > espacio ? `Puedes subir hasta ${max} fotos.` : "");
    const tomar = nuevos.slice(0, Math.max(0, espacio));
    setItems((cur) => [...cur, ...tomar.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))]);
  }

  function quitar(id: string) {
    setItems((cur) => {
      cur.filter((x) => x.id === id).forEach((x) => URL.revokeObjectURL(x.preview));
      return cur.filter((x) => x.id !== id);
    });
    setAviso("");
  }

  return (
    <div>
      <div className="previews">
        {items.map((f, i) => (
          <div className="preview" key={f.id}>
            <img src={f.preview} alt={`Vista previa de la foto ${i + 1}`} />
            <button type="button" className="preview-x" aria-label={`Quitar foto ${i + 1}`} onClick={() => quitar(f.id)}>×</button>
          </div>
        ))}
        {items.length < max && (
          <label className="add-photo">
            <input type="file" accept="image/*" multiple onChange={onFiles} />
            <span aria-hidden="true">+</span>
            <small>Agregar fotos</small>
          </label>
        )}
      </div>
      {aviso && <p className="error" role="alert" style={{ margin: ".4rem 0 0" }}>{aviso}</p>}
    </div>
  );
}
