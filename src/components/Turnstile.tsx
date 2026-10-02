"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

export const CAPTCHA_ACTIVO = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let cargando: Promise<void> | null = null;
function cargarScript() {
  if (window.turnstile) return Promise.resolve();
  if (!cargando) {
    cargando = new Promise<void>((res, rej) => {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.onload = () => res();
      s.onerror = () => { cargando = null; rej(new Error("No se pudo cargar la verificación")); };
      document.head.appendChild(s);
    });
  }
  return cargando;
}

// Verificación anti-bots de Cloudflare (gratuita). Cambia resetKey para pedir una nueva después de un error.
export default function Turnstile({ onToken, resetKey }: { onToken: (t: string) => void; resetKey: number }) {
  const el = useRef<HTMLDivElement>(null);
  const id = useRef<string | undefined>(undefined);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!key || !el.current) return;
    let cancelado = false;
    cargarScript()
      .then(() => {
        if (cancelado || !el.current || !window.turnstile) return;
        id.current = window.turnstile.render(el.current, {
          sitekey: key,
          language: "es",
          callback: (t: string) => cb.current(t),
          "expired-callback": () => cb.current(""),
          "error-callback": () => cb.current(""),
        });
      })
      .catch(() => cb.current(""));
    return () => {
      cancelado = true;
      if (id.current) window.turnstile?.remove(id.current);
      id.current = undefined;
    };
  }, []);

  useEffect(() => {
    if (id.current) { window.turnstile?.reset(id.current); cb.current(""); }
  }, [resetKey]);

  if (!CAPTCHA_ACTIVO) return null;
  return <div ref={el} className="turnstile" />;
}
