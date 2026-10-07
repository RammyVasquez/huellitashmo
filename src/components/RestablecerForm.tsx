"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { errTexto } from "@/lib/util";

export default function RestablecerForm() {
  const [listo, setListo] = useState(false);
  const [vencido, setVencido] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (/error/i.test(location.hash)) setVencido(true); // el enlace ya se usó o venció
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => { if (evento === "PASSWORD_RECOVERY" || evento === "SIGNED_IN") setListo(true); });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setListo(true); });
    const t = setTimeout(() => setVencido(true), 4000); // si no llegó la sesión, el enlace no sirve
    return () => { clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nueva = String(fd.get("nueva")), otra = String(fd.get("otra"));
    setMsg(null);
    if (nueva.length < 10) { setMsg({ ok: false, text: "Usa al menos 10 caracteres." }); return; }
    if (nueva !== otra) { setMsg({ ok: false, text: "Las contraseñas no coinciden." }); return; }
    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password: nueva, data: { must_change_password: false } });
    if (error) setMsg({ ok: false, text: errTexto(error) });
    else setMsg({ ok: true, text: "Listo: tu contraseña ya cambió." });
    setGuardando(false);
  }

  if (msg?.ok)
    return (
      <>
        <p className="ok" role="status">{msg.text}</p>
        <div className="actions"><Link className="btn" href="/admin">Entrar al panel</Link></div>
      </>
    );

  if (!listo)
    return vencido ? (
      <>
        <p className="error" role="alert">Este enlace ya se usó o venció. Pide uno nuevo.</p>
        <div className="actions"><Link className="btn" href="/admin/recuperar">Pedir un enlace nuevo</Link></div>
      </>
    ) : <p className="muted">Verificando tu enlace…</p>;

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label>Contraseña nueva (mínimo 10 caracteres)<input name="nueva" type="password" autoComplete="new-password" required minLength={10} /></label>
      <label>Repítela<input name="otra" type="password" autoComplete="new-password" required minLength={10} /></label>
      <button className="btn" disabled={guardando}>{guardando ? "Guardando…" : "Guardar contraseña"}</button>
      {msg && <p className="error" role="alert">{msg.text}</p>}
    </form>
  );
}
