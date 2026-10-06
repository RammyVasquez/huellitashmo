"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { errTexto, fechaCorta } from "@/lib/util";
import { useShelters } from "./useShelters";

type Miembro = { user_id: string; role: "admin" | "moderador" | "refugio"; shelter_id: string | null; email: string | null; display_name: string | null; created_at: string };
type Credencial = { email: string; password: string };

export const ROL_NOMBRE = { admin: "Administrador/a", moderador: "Moderador/a", refugio: "Personal de refugio" } as const;

export default function TeamTab() {
  const { shelters } = useShelters();
  const [equipo, setEquipo] = useState<Miembro[]>([]);
  const [rol, setRol] = useState<Miembro["role"]>("refugio");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cred, setCred] = useState<Credencial | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("staff").select("*").order("created_at");
    if (error) setMsg({ ok: false, text: `No se pudo cargar el equipo: ${errTexto(error)}` });
    setEquipo((data ?? []) as Miembro[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function llamar(cuerpo: Record<string, unknown>) {
    const { data } = await supabase.auth.getSession();
    const res = await fetch("/api/equipo", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: JSON.stringify(cuerpo),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error ?? "No se pudo completar la acción.");
    return out as { email?: string; password?: string };
  }

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (rol === "admin" && !confirm("Un administrador puede ver y cambiar TODO, incluidos los datos personales. ¿Seguro?")) return;
    setTrabajando(true); setMsg(null); setCred(null); setCopiado(false);
    try {
      const r = await llamar({ accion: "crear", email: fd.get("email"), rol, shelter_id: fd.get("shelter_id"), nombre: fd.get("nombre") });
      setCred({ email: r.email!, password: r.password! });
      setFormKey((k) => k + 1);
      load();
    } catch (err) { setMsg({ ok: false, text: errTexto(err) }); }
    setTrabajando(false);
  }

  async function reiniciar(m: Miembro) {
    if (!confirm(`¿Generar una contraseña temporal nueva para ${m.email}? La actual dejará de funcionar.`)) return;
    setTrabajando(true); setMsg(null); setCred(null); setCopiado(false);
    try {
      const r = await llamar({ accion: "reiniciar", user_id: m.user_id });
      setCred({ email: r.email ?? m.email ?? "", password: r.password! });
    } catch (err) { setMsg({ ok: false, text: errTexto(err) }); }
    setTrabajando(false);
  }

  async function quitar(m: Miembro) {
    if (!confirm(`¿Quitar el acceso de ${m.email}? Su cuenta se eliminará y no podrá volver a entrar.`)) return;
    setTrabajando(true); setMsg(null); setCred(null);
    try { await llamar({ accion: "quitar", user_id: m.user_id }); setMsg({ ok: true, text: "Acceso eliminado." }); load(); }
    catch (err) { setMsg({ ok: false, text: errTexto(err) }); }
    setTrabajando(false);
  }

  async function copiarMensaje() {
    if (!cred) return;
    const texto = `Hola, te creé tu acceso al panel de Huellitas HMO.\nEntra en: ${window.location.origin}/admin\nCorreo: ${cred.email}\nContraseña temporal: ${cred.password}\nAl entrar te pedirá cambiarla por una tuya.`;
    try { await navigator.clipboard.writeText(texto); setCopiado(true); } catch { window.prompt("Copia este mensaje:", texto); }
  }

  const refugio = (id: string | null) => shelters.find((s) => s.id === id)?.name ?? "—";

  return (
    <>
      <h2>Dar acceso a una persona</h2>
      <p className="muted" style={{ maxWidth: "65ch" }}>
        <b>Personal de refugio:</b> solo ve y edita lo de su refugio (animales, necesidades, perfil y solicitudes de adopción).{" "}
        <b>Moderador/a:</b> revisa reportes de mascotas y casos de rescate. <b>Administrador/a:</b> todo.
      </p>
      <form className="stack" key={formKey} onSubmit={crear}>
        <label>Correo de la persona<input name="email" type="email" required autoComplete="off" /></label>
        <label>Nombre (opcional)<input name="nombre" autoComplete="off" /></label>
        <label>Tipo de acceso
          <select value={rol} onChange={(e) => setRol(e.target.value as Miembro["role"])}>
            <option value="refugio">Personal de refugio</option>
            <option value="moderador">Moderador/a</option>
            <option value="admin">Administrador/a</option>
          </select>
        </label>
        {rol === "refugio" && (
          <label>Refugio
            <select name="shelter_id" required defaultValue="">
              <option value="" disabled>Elige un refugio</option>
              {shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}
        <button className="btn" disabled={trabajando}>{trabajando ? "Creando…" : "Crear acceso"}</button>
      </form>

      {cred && (
        <div className="alertbox" role="status" style={{ marginTop: "1rem" }}>
          <b>Acceso listo.</b> Comparte estos datos por un medio privado. <b>La contraseña solo se muestra ahora.</b>
          <p style={{ margin: ".5rem 0" }}>Correo: <b>{cred.email}</b><br />Contraseña temporal: <b style={{ fontFamily: "monospace", fontSize: "1.1rem" }}>{cred.password}</b></p>
          <button className="btn ghost" onClick={copiarMensaje}>{copiado ? "¡Mensaje copiado!" : "Copiar mensaje para enviar"}</button>
          <p className="muted" style={{ margin: ".5rem 0 0", fontSize: ".92rem" }}>Al entrar por primera vez, el panel le pedirá cambiarla.</p>
        </div>
      )}
      {msg && <p className={msg.ok ? "ok" : "error"} role="status">{msg.text}</p>}

      <h2 style={{ marginTop: "2.5rem" }}>Equipo ({equipo.length})</h2>
      {equipo.map((m) => (
        <div className="admin-row" key={m.user_id}>
          <div className="grow">
            <b>{m.display_name || m.email}</b>{m.display_name && <span className="muted"> · {m.email}</span>}
            <div>
              <span className={`tag ${m.role === "admin" ? "ok" : ""}`}>{ROL_NOMBRE[m.role]}</span>
              {m.role === "refugio" && <span className="tag">{refugio(m.shelter_id)}</span>}
              <span className="muted"> desde {fechaCorta(m.created_at)}</span>
            </div>
          </div>
          <div className="row-actions">
            <button className="btn ghost" disabled={trabajando} onClick={() => reiniciar(m)}>Nueva contraseña</button>
            <button className="btn ghost" disabled={trabajando} onClick={() => quitar(m)}>Quitar acceso</button>
          </div>
        </div>
      ))}
    </>
  );
}
