"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import ReportsTab from "./ReportsTab";
import AnimalsTab from "./AnimalsTab";
import NeedsTab from "./NeedsTab";
import SheltersTab from "./SheltersTab";
import StoriesTab from "./StoriesTab";
import SponsorsTab from "./SponsorsTab";
import EventsTab from "./EventsTab";
import WelfareTab from "./WelfareTab";
import AdoptionsTab from "./AdoptionsTab";
import BackupTab, { CLAVE_RESPALDO } from "./BackupTab";
import TeamTab, { ROL_NOMBRE } from "./TeamTab";
import AccountTab from "./AccountTab";

type Rol = "admin" | "moderador" | "refugio";
type Acceso = { role: Rol; shelter_id?: string | null };
type Tab = "reportes" | "rescates" | "adopciones" | "animales" | "necesidades" | "padrinos" | "refugios" | "historias" | "eventos" | "equipo" | "respaldo" | "cuenta";

// Cada tipo de acceso ve solo sus pestañas (la base de datos además lo exige por su cuenta)
const TABS_POR_ROL: Record<Rol, Tab[]> = {
  admin: ["reportes", "rescates", "adopciones", "animales", "necesidades", "padrinos", "refugios", "historias", "eventos", "equipo", "respaldo", "cuenta"],
  moderador: ["reportes", "rescates", "cuenta"],
  refugio: ["adopciones", "animales", "necesidades", "padrinos", "refugios", "historias", "eventos", "cuenta"],
};
const ETIQUETA: Record<Tab, string> = {
  reportes: "Reportes", rescates: "Rescates", adopciones: "Adopciones", animales: "Animales", necesidades: "Necesidades", padrinos: "Padrinos", historias: "Historias", eventos: "Eventos",
  refugios: "Refugios", equipo: "Equipo", respaldo: "Respaldo", cuenta: "Mi cuenta",
};

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
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Acceso al panel</h1>
      <p className="lead">Para administradores, moderadores y personal de refugios.</p>
      <form className="stack" onSubmit={onSubmit}>
        <label>Correo<input name="email" type="email" autoComplete="username" required /></label>
        <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
        <button className="btn" disabled={cargando}>{cargando ? "Entrando…" : "Entrar"}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
      <p><a href="/admin/recuperar">¿Olvidaste tu contraseña?</a></p>
    </>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [acceso, setAcceso] = useState<Acceso | null | undefined>(undefined); // undefined = verificando
  const [tab, setTab] = useState<Tab>("reportes");
  const [nombreRefugio, setNombreRefugio] = useState("");
  const [pend, setPend] = useState({ reportes: 0, rescates: 0, urgentes: 0, adopciones: 0 });
  const [diasRespaldo, setDiasRespaldo] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) { setAcceso(undefined); return; }
    supabase.rpc("my_access").then(({ data }) => setAcceso((data as Acceso | null) ?? null));
  }, [uid]);

  const rol = acceso?.role;
  const refugioId = rol === "refugio" ? acceso?.shelter_id ?? undefined : undefined;
  const visibles = rol ? TABS_POR_ROL[rol] : [];
  const actual: Tab = visibles.includes(tab) ? tab : visibles[0] ?? "cuenta";

  useEffect(() => {
    if (!refugioId) return;
    supabase.from("shelters").select("name").eq("id", refugioId).single().then(({ data }) => setNombreRefugio(data?.name ?? ""));
  }, [refugioId]);

  // Contadores de pendientes: solo de lo que cada rol puede ver
  useEffect(() => {
    if (!rol) return;
    (async () => {
      const cuenta = (tabla: string, estado: string, urgente?: boolean) => {
        let q = supabase.from(tabla).select("id", { count: "exact", head: true }).eq("status", estado);
        if (urgente) q = q.eq("urgent", true);
        return q;
      };
      const vacio = { count: 0 };
      const [a, b, c, d] = await Promise.all([
        rol !== "refugio" ? cuenta("reports", "pendiente") : vacio,
        rol !== "refugio" ? cuenta("welfare_reports", "pendiente") : vacio,
        rol !== "refugio" ? cuenta("welfare_reports", "pendiente", true) : vacio,
        rol !== "moderador" ? cuenta("adoption_requests", "nueva") : vacio,
      ]);
      setPend({ reportes: a.count ?? 0, rescates: b.count ?? 0, urgentes: c.count ?? 0, adopciones: d.count ?? 0 });
    })();
  }, [rol, actual]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(CLAVE_RESPALDO);
      setDiasRespaldo(v ? Math.floor((Date.now() - new Date(v).getTime()) / 864e5) : null);
    } catch { setDiasRespaldo(null); }
  }, [actual]);

  if (session === undefined) return <p className="muted">Cargando…</p>;
  if (!session) return <Login />;
  if (acceso === undefined) return <p className="muted">Verificando permisos…</p>;
  if (acceso === null || !rol)
    return (
      <>
        <h1>Sin permisos</h1>
        <p>Tu cuenta ({session.user.email}) todavía no tiene acceso al panel. Pídele a quien administra el sitio que te lo active.</p>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Salir</button>
      </>
    );

  const email = session.user.email ?? "";
  const debeCambiar = session.user.user_metadata?.must_change_password === true;
  const titulo = rol === "admin" ? "Panel de administración" : rol === "moderador" ? "Panel de moderación" : `Panel${nombreRefugio ? ` · ${nombreRefugio}` : " del refugio"}`;

  // Cuenta nueva: primero hay que cambiar la contraseña temporal
  if (debeCambiar)
    return (
      <>
        <div className="section-head">
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", margin: 0 }}>{titulo}</h1>
          <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Salir</button>
        </div>
        <AccountTab email={email} rolNombre={ROL_NOMBRE[rol]} obligatorio />
      </>
    );

  return (
    <>
      <div className="section-head">
        <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", margin: 0 }}>{titulo}</h1>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Salir</button>
      </div>
      <div className="tabs" role="tablist">
        {visibles.map((id) => (
          <button key={id} role="tab" aria-selected={actual === id} onClick={() => setTab(id)}>
            {id === "refugios" && rol === "refugio" ? "Mi refugio" : ETIQUETA[id]}
            {id === "reportes" && pend.reportes > 0 && ` (${pend.reportes})`}
            {id === "adopciones" && pend.adopciones > 0 && ` (${pend.adopciones})`}
            {id === "rescates" && pend.rescates > 0 && ` (${pend.rescates})${pend.urgentes > 0 ? " ¡urgente!" : ""}`}
          </button>
        ))}
      </div>
      {rol === "admin" && actual !== "respaldo" && (diasRespaldo === null || diasRespaldo >= 7) && (
        <p className="alertbox" role="status">
          {diasRespaldo === null ? "No has descargado un respaldo desde este navegador." : `Hace ${diasRespaldo} días que no descargas un respaldo.`}{" "}
          <button type="button" className="link" onClick={() => setTab("respaldo")}>Ir a Respaldo</button>
        </p>
      )}
      {actual === "reportes" && <ReportsTab />}
      {actual === "rescates" && <WelfareTab esAdmin={rol === "admin"} />}
      {actual === "adopciones" && <AdoptionsTab rol={rol} />}
      {actual === "animales" && <AnimalsTab shelterId={refugioId} />}
      {actual === "necesidades" && <NeedsTab shelterId={refugioId} />}
      {actual === "padrinos" && <SponsorsTab shelterId={refugioId} />}
      {actual === "refugios" && <SheltersTab soloId={refugioId} />}
      {actual === "historias" && <StoriesTab shelterId={refugioId} />}
      {actual === "eventos" && <EventsTab shelterId={refugioId} />}
      {actual === "equipo" && <TeamTab />}
      {actual === "respaldo" && <BackupTab />}
      {actual === "cuenta" && <AccountTab email={email} rolNombre={ROL_NOMBRE[rol]} obligatorio={false} />}
    </>
  );
}
