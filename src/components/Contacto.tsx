// Correo de contacto del proyecto (se define en NEXT_PUBLIC_CONTACT_EMAIL)
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

export default function Contacto({ prefijo = "Contacto:" }: { prefijo?: string }) {
  if (!CONTACT_EMAIL) return null;
  return <>{prefijo} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></>;
}
