export const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Tope "redondo" del eje vertical para que las gráficas se lean fácil
export function techo(m: number) {
  if (m <= 4) return 4;
  for (const paso of [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]) if (m / paso <= 4) return Math.ceil(m / paso) * paso;
  return Math.ceil(m / 1000) * 1000;
}
