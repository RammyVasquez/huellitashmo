"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { errTexto } from "@/lib/util";

export default function AccountTab({ email, rolNombre, obligatorio }: { email: string; rolNombre: string; obligatorio: boolean }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function cambiar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nueva = String(fd.get("nueva"));
    if (nueva.length < 10) { setMsg({ ok: false, text: "La contraseña debe tener al menos 10 caracteres." }); return; }
    if (nueva !== String(fd.get("repetir"))) { setMsg({ ok: false, text: "Las dos contraseñas no coinciden." }); return; }
    setGuardando(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: nueva, data: { must_change_password: false } });
    if (error) setMsg({ ok: false, text: `No se pudo cambiar: ${errTexto(error)}` });
    else { setMsg({ ok: true, text: "Contraseña actualizada." }); setFormKey((k) => k + 1); }
    setGuardando(false);
  }

  return (
    <>
      {obligatorio && (
        <p className="alertbox" role="alert"><b>Por seguridad, cambia tu contraseña temporal para continuar.</b> Elige una que solo tú conozcas.</p>
      )}
      <h2>Mi cuenta</h2>
      <p>Correo: <b>{email}</b><br />Tipo de acceso: <b>{rolNombre}</b></p>
      <h3>Cambiar contraseña</h3>
      <form className="stack" key={formKey} onSubmit={cambiar}>
        <label>Contraseña nueva (mínimo 10 caracteres)<input name="nueva" type="password" autoComplete="new-password" minLength={10} required /></label>
        <label>Repite la contraseña<input name="repetir" type="password" autoComplete="new-password" minLength={10} required /></label>
        <button className="btn" disabled={guardando}>{guardando ? "Guardando…" : "Guardar contraseña"}</button>
      </form>
      {msg && <p className={msg.ok ? "ok" : "error"} role="status">{msg.text}</p>}
    </>
  );
}
