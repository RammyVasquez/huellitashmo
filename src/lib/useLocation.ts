"use client";
import { useState } from "react";
import type { Pos } from "@/lib/geo";

// Ubicación de la persona: por GPS del navegador o tocando el mapa. Nada se envía a ningún servidor.
export function useLocation(okMsg: string) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [estado, setEstado] = useState<"idle" | "buscando" | "listo" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [picking, setPicking] = useState(false);

  function locate() {
    setPicking(false);
    if (!("geolocation" in navigator)) {
      setEstado("error");
      setPicking(true);
      setMsg("Tu navegador no permite obtener la ubicación. Toca el mapa para marcar dónde estás.");
      return;
    }
    setEstado("buscando");
    setMsg("Buscando tu ubicación… si tu navegador te pregunta, elige “Permitir”.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setEstado("listo");
        setMsg(okMsg);
      },
      (err) => {
        setEstado("error");
        setPicking(true);
        setMsg(
          err.code === 1
            ? "Tu navegador tiene bloqueado el permiso de ubicación para este sitio. Puedes activarlo (abajo te decimos cómo) o tocar el mapa para marcar dónde estás."
            : err.code === 3
            ? "Tardó demasiado en encontrarte. Intenta de nuevo o toca el mapa para marcar dónde estás."
            : "No pudimos determinar tu ubicación. Revisa que la ubicación del teléfono esté activada o toca el mapa para marcar dónde estás."
        );
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }

  function startPicking() {
    setPicking(true);
    setEstado("idle");
    setMsg("Toca el mapa en el lugar donde estás.");
    document.querySelector(".map-box")?.scrollIntoView({ block: "center" });
  }

  function onPick(p: Pos) {
    setPos(p);
    setEstado("listo");
    setPicking(false);
    setMsg(`Ubicación marcada en el mapa. ${okMsg}`);
  }

  return { pos, estado, msg, picking, locate, startPicking, onPick };
}
