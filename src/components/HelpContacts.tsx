import type { HelpContact } from "@/lib/types";

export default function HelpContacts({ contacts }: { contacts: HelpContact[] }) {
  return (
    <div className="box">
      <h3 style={{ marginTop: 0 }}>Dónde pedir ayuda</h3>
      <p style={{ margin: "0 0 .6rem" }}>Si hay una persona en peligro o un delito en curso, llama al <b>911</b>.</p>
      {contacts.length > 0 && (
        <ul className="contactos">
          {contacts.map((c) => (
            <li key={c.id} className="contacto">
              <div><b>{c.name}</b>{c.note && <span className="muted"> · {c.note}</span>}</div>
              <a className="btn call" href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} aria-label={`Llamar a ${c.name}`}>Llamar · {c.phone}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
