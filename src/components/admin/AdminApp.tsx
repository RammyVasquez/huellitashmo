"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import ReportsTab from "./ReportsTab";
import AnimalsTab from "./AnimalsTab";
import NeedsTab from "./NeedsTab";
import SheltersTab from "./SheltersTab";
import WelfareTab from "./WelfareTab";
import AdoptionsTab from "./AdoptionsTab";
import BackupTab, { CLAVE_RESPALDO } from "./BackupTab";

const TABS = [
  ["reportes", "Reportes"],
  ["rescates", "Rescates"],
  ["adopciones", "Adopciones"],
  ["animales", "Animales"],
  ["necesidades", "Necesidades"],
  ["refugios", "Refugios"],
  ["respaldo", "Respaldo"],
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
  const [pend, setPend] = useState({ reportes: 0, rescates: 0, urgentes: 0, adopciones: 0 });
  const [diasRespaldo, setDiasRespaldo] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setEsAdmin(null); return; }
    supabase.rpc("is_admin").then(({ data }) => setEsAdmin(data === true));
  }, [session]);

  useEffect(() => {
    if (!esAdmin) return;
    (async () => {
      const cuenta = (tabla: string, urgente?: boolean) => {
        let q = supabase.from(tabla).select("id", { count: "exact", head: true }).eq("status", "pendiente");
        if (urgente) q = q.eq("urgent", true);
        return q;
      };
      const [a, b, c, d] = await Promise.all([
        cuenta("reports"), cuenta("welfare_reports"), cuenta("welfare_reports", true),
        supabase.from("adoption_requests").select("id", { count: "exact", head: true }).eq("status", "nueva"),
      ]);
      setPend({ reportes: a.count ?? 0, rescates: b.count ?? 0, urgentes: c.count ?? 0, adopciones: d.count ?? 0 });
    })();
  }, [esAdmin, tab]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(CLAVE_RESPALDO);
      setDiasRespaldo(v ? Math.floor((Date.now() - new Date(v).getTime()) / 864e5) : null);
    } catch { setDiasRespaldo(null); }
  }, [tab]);

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
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
            {id === "reportes" && pend.reportes > 0 && ` (${pend.reportes})`}
            {id === "adopciones" && pend.adopciones > 0 && ` (${pend.adopciones})`}
            {id === "rescates" && pend.rescates > 0 && ` (${pend.rescates})${pend.urgentes > 0 ? " ¡urgente!" : ""}`}
          </button>
        ))}
      </div>
      {tab !== "respaldo" && (diasRespaldo === null || diasRespaldo >= 7) && (
        <p className="alertbox" role="status">
          {diasRespaldo === null ? "No has descargado un respaldo desde este navegador." : `Hace ${diasRespaldo} días que no descargas un respaldo.`}{" "}
          <button type="button" className="link" onClick={() => setTab("respaldo")}>Ir a Respaldo</button>
        </p>
      )}
      {tab === "reportes" && <ReportsTab />}
      {tab === "rescates" && <WelfareTab />}
      {tab === "adopciones" && <AdoptionsTab />}
      {tab === "animales" && <AnimalsTab />}
      {tab === "necesidades" && <NeedsTab />}
      {tab === "refugios" && <SheltersTab />}
      {tab === "respaldo" && <BackupTab />}
    </>
  );
}
