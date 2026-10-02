export default function LocationHelp() {
  return (
    <details className="help box">
      <summary>¿Cómo activo la ubicación?</summary>
      <ul>
        <li><b>iPhone:</b> Ajustes → Privacidad y seguridad → Localización → activa “Localización” y en Safari (Sitios web) elige “Al usar la app”. Luego, en Safari, toca “aA” junto a la dirección → Ajustes del sitio web → Ubicación → “Preguntar” o “Permitir”.</li>
        <li><b>Android (Chrome):</b> toca el ícono junto a la dirección → Permisos → Ubicación → “Permitir”.</li>
        <li>Si abriste esta liga desde Facebook, Instagram o WhatsApp, ábrela en Safari o Chrome: los navegadores dentro de esas apps suelen bloquear la ubicación.</li>
      </ul>
    </details>
  );
}
