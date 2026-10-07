// Cómo se dice en Hermosillo: esterilizada (hembra) y castrado (macho). Si no se sabe el sexo, se dicen ambas.
export function esteril(sex: string | null | undefined, mayuscula = false) {
  const t = sex === "hembra" ? "esterilizada" : sex === "macho" ? "castrado" : "esterilizado/castrado";
  return mayuscula ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}
