"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import ReportsTab from "./ReportsTab";
import AnimalsTab from "./AnimalsTab";
import NeedsTab from "./NeedsTab";
import SheltersTab from "./SheltersTab";

const TABS = [
  ["reportes", "Reportes"],
  ["animales", "Animales"],
  ["necesidades", "Necesidades"],
  ["refugios", "Refugios"],
] as const;
type Tab = (typeof TABS)[number][0];

function Login() {
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setCargando(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    if (error) setError("Correo o contraseña incorrectos.");
    setCargando(false);
  }
  return (
    <>
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Panel del refugio</h1>
      <p className="lead">Entra con tu cuenta de administrador.</p>
      <form className="stack" onSubmit={onSubmit}>
        <label>Correo<input name="email" type="email" autoComplete="username" required /></label>
        <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
        <button className="btn" disabled={cargando}>{cargando ? "Entrando…" : "Entrar"}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
    </>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("reportes");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setEsAdmin(null); return; }
    supabase.rpc("is_admin").then(({ data }) => setEsAdmin(data === true));
  }, [session]);

  if (session === undefined) return <p className="muted">Cargando…</p>;
  if (!session) return <Login />;
  if (esAdmin === null) return <p className="muted">Verificando permisos…</p>;
  if (!esAdmin)
    return (
      <>
        <h1>Sin permisos</h1>
        <p>Tu cuenta ({session.user.email}) no está autorizada como administradora.</p>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Salir</button>
      </>
    );

  return (
    <>
      <div className="section-head">
        <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", margin: 0 }}>Panel del refugio</h1>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Salir</button>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "reportes" && <ReportsTab />}
      {tab === "animales" && <AnimalsTab />}
      {tab === "necesidades" && <NeedsTab />}
      {tab === "refugios" && <SheltersTab />}
    </>
  );
}
