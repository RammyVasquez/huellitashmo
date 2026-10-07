import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { MESES_CORTOS, techo } from "@/lib/graficas";

export type DatosInforme = {
  generado: Date;
  desde: string | null;
  cifras: { etiqueta: string; valor: number }[];
  meses: { mes: string; reportes: number; adopciones: number; auxiliados: number }[];
  refugios: { nombre: string; tipo: string; verificado: boolean }[];
  eventos: { fecha: string; titulo: string; tipo: string; resultados: string }[];
};

const NAVY = rgb(0.075, 0.157, 0.31);
const SOL = rgb(1, 0.788, 0.2);
const TEXTO = rgb(0.08, 0.12, 0.2);
const GRIS = rgb(0.32, 0.376, 0.486);
const LINEA = rgb(0.835, 0.871, 0.929);
const CIELO = rgb(0.933, 0.953, 0.984);
const W = 595, H = 842, M = 40, ANCHO = W - 2 * M;

const fechaLarga = (d: Date) => d.toLocaleDateString("es-MX", { timeZone: "America/Hermosillo", day: "numeric", month: "long", year: "numeric" });

export const DEFINICIONES: [string, string][] = [
  ["Animales registrados", "Animales dados de alta en la plataforma por un refugio, estén o no disponibles."],
  ["Adopciones", "Animales que el refugio marcó como adoptados en su panel. Es el refugio quien lo confirma."],
  ["Esterilizados o castrados", "Animales registrados con el dato de esterilizado o castrado. Indica su estado, no que la esterilización se haya hecho gracias a la plataforma."],
  ["Padrinos", "Número de padrinos que reporta cada refugio por animal. Lo actualizan ellos."],
  ["Familias reunidas", "Reportes de mascotas perdidas o encontradas que el equipo marcó como reunificados tras confirmarlo con las personas."],
  ["Animales auxiliados", "Casos de animales heridos, enfermos o en riesgo que el equipo marcó como resueltos."],
  ["Seguimientos respondidos", "Familias que, después de adoptar, respondieron la encuesta de seguimiento a 1, 3 o 6 meses."],
  ["Eventos realizados", "Jornadas de adopción, esterilización y castración, o acopio que un refugio o el equipo marcó como realizadas."],
  ["Historias publicadas", "Historias de adopción publicadas con la autorización de la familia."],
];

function partir(texto: string, fuente: PDFFont, tam: number, ancho: number): string[] {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.split(/\s+/)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (fuente.widthOfTextAtSize(prueba, tam) <= ancho) actual = prueba;
    else { if (actual) lineas.push(actual); actual = palabra; }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function recorta(texto: string, fuente: PDFFont, tam: number, ancho: number) {
  if (fuente.widthOfTextAtSize(texto, tam) <= ancho) return texto;
  let t = texto;
  while (t.length > 1 && fuente.widthOfTextAtSize(`${t}…`, tam) > ancho) t = t.slice(0, -1);
  return `${t}…`;
}

export async function generarInforme(d: DatosInforme): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Informe de impacto · Huellitas HMO");
  pdf.setAuthor("Huellitas HMO");
  pdf.setLanguage("es-MX");
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const neg = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pie = (p: PDFPage, n: number) => {
    p.drawLine({ start: { x: M, y: 44 }, end: { x: W - M, y: 44 }, thickness: 0.5, color: LINEA });
    p.drawText(`huellitashmo.site · Informe generado el ${fechaLarga(d.generado)}`, { x: M, y: 30, size: 8, font: reg, color: GRIS });
    p.drawText(`Página ${n} de 2`, { x: W - M - reg.widthOfTextAtSize(`Página ${n} de 2`, 8), y: 30, size: 8, font: reg, color: GRIS });
  };
  const titulo = (p: PDFPage, texto: string, y: number) => {
    p.drawText(texto, { x: M, y, size: 14, font: neg, color: NAVY });
    p.drawRectangle({ x: M, y: y - 6, width: 36, height: 3, color: SOL });
  };

  // ---------- Página 1 ----------
  const p1 = pdf.addPage([W, H]);
  p1.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: NAVY });
  p1.drawRectangle({ x: M, y: H - 38, width: 44, height: 5, color: SOL });
  p1.drawText("Informe de impacto", { x: M, y: H - 72, size: 28, font: neg, color: rgb(1, 1, 1) });
  p1.drawText("Huellitas HMO · Hermosillo, Sonora", { x: M, y: H - 94, size: 12, font: reg, color: SOL });
  const corte = `Datos al ${fechaLarga(d.generado)}`;
  p1.drawText(corte, { x: W - M - reg.widthOfTextAtSize(corte, 10), y: H - 94, size: 10, font: reg, color: rgb(1, 1, 1) });

  let y = H - 138;
  const intro = `Estas cifras salen directo de la base de datos de la plataforma, sin ajustes manuales.${d.desde ? ` Hay registros desde el ${d.desde}.` : ""}`;
  for (const l of partir(intro, reg, 10.5, ANCHO)) { p1.drawText(l, { x: M, y, size: 10.5, font: reg, color: GRIS }); y -= 15; }

  y -= 14;
  titulo(p1, "Cifras clave", y);
  y -= 26;
  const cw = (ANCHO - 24) / 3, ch = 66;
  d.cifras.forEach((c, i) => {
    const col = i % 3, fila = Math.floor(i / 3);
    const x = M + col * (cw + 12), top = y - fila * (ch + 12);
    p1.drawRectangle({ x, y: top - ch, width: cw, height: ch, color: CIELO, borderColor: LINEA, borderWidth: 0.5 });
    p1.drawText(String(c.valor), { x: x + 12, y: top - 34, size: 24, font: neg, color: NAVY });
    partir(c.etiqueta, reg, 9, cw - 24).slice(0, 2).forEach((l, k) => p1.drawText(l, { x: x + 12, y: top - 48 - k * 11, size: 9, font: reg, color: GRIS }));
  });
  y -= Math.ceil(d.cifras.length / 3) * (ch + 12) + 16;

  titulo(p1, "Cómo contamos cada cifra", y);
  y -= 24;
  for (const [t, def] of DEFINICIONES) {
    const lineas = partir(def, reg, 9, ANCHO - 132);
    p1.drawText(t, { x: M, y, size: 9, font: neg, color: TEXTO });
    lineas.forEach((l, k) => p1.drawText(l, { x: M + 132, y: y - k * 11.5, size: 9, font: reg, color: GRIS }));
    y -= Math.max(1, lineas.length) * 11.5 + 5;
  }
  pie(p1, 1);

  // ---------- Página 2 ----------
  const p2 = pdf.addPage([W, H]);
  p2.drawRectangle({ x: M, y: H - 38, width: 44, height: 5, color: SOL });
  let y2 = H - 64;
  titulo(p2, "Actividad por mes (últimos 12 meses)", y2);
  y2 -= 22;

  const barras = (nombre: string, valores: number[], top: number) => {
    const alto = 100, ejeY = top - 20 - alto, x0 = M + 28, ancho = ANCHO - 36;
    p2.drawText(nombre, { x: M, y: top, size: 10.5, font: neg, color: TEXTO });
    const max = techo(Math.max(0, ...valores));
    for (const f of [0, 0.5, 1]) {
      const yy = ejeY + alto * f;
      p2.drawLine({ start: { x: x0, y: yy }, end: { x: x0 + ancho, y: yy }, thickness: 0.4, color: LINEA });
      const et = String(Math.round(max * f));
      p2.drawText(et, { x: x0 - 6 - reg.widthOfTextAtSize(et, 8), y: yy - 3, size: 8, font: reg, color: GRIS });
    }
    const paso = ancho / valores.length, bw = Math.min(22, paso * 0.62);
    valores.forEach((v, i) => {
      const bx = x0 + i * paso + (paso - bw) / 2, bh = (v / max) * alto;
      if (v > 0) {
        p2.drawRectangle({ x: bx, y: ejeY, width: bw, height: bh, color: NAVY });
        const et = String(v);
        p2.drawText(et, { x: bx + bw / 2 - neg.widthOfTextAtSize(et, 8) / 2, y: ejeY + bh + 3, size: 8, font: neg, color: TEXTO });
      }
      const m = d.meses[i]?.mes ?? "";
      const [anio, mes] = [m.slice(0, 4), Number(m.slice(5, 7))];
      const et = `${MESES_CORTOS[mes - 1] ?? ""}`;
      p2.drawText(et, { x: bx + bw / 2 - reg.widthOfTextAtSize(et, 8) / 2, y: ejeY - 12, size: 8, font: reg, color: GRIS });
      if (mes === 1 || i === 0) p2.drawText(anio, { x: bx + bw / 2 - reg.widthOfTextAtSize(anio, 7) / 2, y: ejeY - 22, size: 7, font: reg, color: GRIS });
    });
    if (valores.every((v) => v === 0)) p2.drawText("Todavía sin datos: se llenará conforme haya actividad.", { x: x0 + 8, y: ejeY + alto / 2 - 4, size: 9, font: reg, color: GRIS });
  };

  barras("Reportes de mascotas perdidas y encontradas, por mes", d.meses.map((m) => m.reportes), y2);
  y2 -= 172;
  barras("Adopciones por mes", d.meses.map((m) => m.adopciones), y2);
  y2 -= 172;
  barras("Animales auxiliados (casos de rescate resueltos), por mes", d.meses.map((m) => m.auxiliados), y2);
  y2 -= 172;

  titulo(p2, "Refugios y rescatistas en la plataforma", y2);
  y2 -= 22;
  if (d.refugios.length === 0) { p2.drawText("Pronto se sumarán refugios.", { x: M, y: y2, size: 9.5, font: reg, color: GRIS }); y2 -= 16; }
  d.refugios.slice(0, 7).forEach((r) => {
    const txt = `${r.nombre} · ${r.tipo}${r.verificado ? " · Verificado" : ""}`;
    p2.drawText(recorta(txt, reg, 9.5, ANCHO), { x: M, y: y2, size: 9.5, font: reg, color: TEXTO });
    y2 -= 14;
  });
  if (d.refugios.length > 7) { p2.drawText(`y ${d.refugios.length - 7} más`, { x: M, y: y2, size: 9, font: reg, color: GRIS }); y2 -= 14; }

  y2 -= 8;
  titulo(p2, "Eventos realizados", y2);
  y2 -= 22;
  if (d.eventos.length === 0) p2.drawText("Aún no hay eventos registrados como realizados.", { x: M, y: y2, size: 9.5, font: reg, color: GRIS });
  d.eventos.slice(0, 4).forEach((e) => {
    p2.drawText(recorta(`${e.fecha} · ${e.titulo} · ${e.tipo}`, neg, 9.5, ANCHO), { x: M, y: y2, size: 9.5, font: neg, color: TEXTO });
    y2 -= 13;
    if (e.resultados) { p2.drawText(recorta(e.resultados, reg, 9, ANCHO), { x: M, y: y2, size: 9, font: reg, color: GRIS }); y2 -= 13; }
    y2 -= 3;
  });
  pie(p2, 2);

  return pdf.save();
}
