"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { enComun } from "@/lib/buscar";
import { fmtKm, km, type Pos } from "@/lib/geo";
import { supabase } from "@/lib/supabase";
import { fechaCorta } from "@/lib/util";
import type { PublicReport } from "@/lib/types";
import FotoFit from "./FotoFit";

type Item = PublicReport & { dist: number | null; rasgos: string[] };

// Después de enviar un reporte, muestra lo que ya hay publicado del tipo contrario (misma especie, cerca y reciente)
export default function CoincidenciasRapidas({ kind, species, loc, descripcion }: { kind: "perdido" | "encontrado"; species: string; loc: Pos | null; descripcion: string }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const contrario = kind === "perdido" ? "encontrado" : "perdido";

  useEffect(() => {
    const desde = new Date(Date.now() - 60 * 86400000).toISOString();
    supabase.from("reports_public").select("*").eq("kind", contrario).eq("species", species).eq("status", "activo").gte("created_at", desde)
      .order("created_at", { ascending: false }).limit(60)
      .then(({ data }) => {
        const lista = ((data ?? []) as PublicReport[])
          .map((r) => ({ ...r, dist: loc && r.lat != null && r.lng != null ? km(loc, { lat: r.lat, lng: r.lng }) : null, rasgos: enComun(descripcion, r.description) }))
          .filter((r) => r.dist === null || r.dist <= 25)
          .sort((a, b) => (a.dist ?? 99) - (b.dist ?? 99) || b.rasgos.length - a.rasgos.length)
          .slice(0, 6);
        setItems(lista);
      });
  }, [contrario, species, loc, descripcion]);

  if (items === null) return <p className="muted">Buscando reportes parecidos…</p>;
  return <CoincidenciasLista kind={kind} items={items} />;
}

export type { Item as CoincidenciaItem };

export function CoincidenciasLista({ kind, items }: { kind: "perdido" | "encontrado"; items: Item[] }) {
  const contrario = kind === "perdido" ? "encontrado" : "perdido";
  const titulo = kind === "perdido" ? "Mira si tu mascota está entre las que ya reportaron como encontradas" : "Mira si alguien ya está buscando a este animal";

  return (
    <section className="coinc" style={{ marginTop: "1.6rem" }} aria-labelledby="coinc">
      <h3 id="coinc">{titulo}</h3>
      {items.length === 0 ? (
        <p className="muted">
          Por ahora no hay reportes {contrario === "encontrado" ? "de animales encontrados" : "de animales perdidos"} cerca y recientes que coincidan. Estaremos pendientes: si aparece un posible caso, podremos escribirte por WhatsApp.
        </p>
      ) : (
        <>
          <div className="grid">
            {items.map((r) => (
              <Link key={r.id} href={`/reportes/${r.id}`} className="card">
                {(r.photos?.[0] ?? r.photo_url) ? <FotoFit src={(r.photos?.[0] ?? r.photo_url)!} alt={`Mascota ${r.kind}`} /> : <div className="ph" />}
                <div className="body">
                  <span className={`tag ${r.kind}`}>{r.kind}</span>
                  <p className="clamp" style={{ margin: ".4rem 0" }}>{r.description}</p>
                  <p className="muted" style={{ margin: 0, fontSize: ".92rem" }}>
                    {r.zone ?? "Sin zona"} · {fechaCorta(r.created_at)}{r.dist != null ? ` · aprox. a ${fmtKm(r.dist)}` : ""}
                  </p>
                  {r.rasgos.length > 0 && <p style={{ margin: ".4rem 0 0", fontSize: ".92rem" }}><b>Se parecen en:</b> {r.rasgos.join(", ")}</p>}
                </div>
              </Link>
            ))}
          </div>
          <p className="muted" style={{ fontSize: ".9rem" }}>Es una búsqueda automática por zona y descripción: puede equivocarse. Revisa las fotos con calma.</p>
        </>
      )}
    </section>
  );
}
