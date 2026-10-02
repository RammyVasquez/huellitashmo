import type { HelpContact } from "@/lib/types";

export default function HelpContacts({ contacts }: { contacts: HelpContact[] }) {
  return (
    <div className="box">
      <h3 style={{ marginTop: 0 }}>Dónde pedir ayuda</h3>
      <p style={{ margin: "0 0 .6rem" }}>Si hay una persona en peligro o un delito en curso, llama al <b>911</b>.</p>
      {contacts.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
          {contacts.map((c) => (
            <li key={c.id}>
              <b>{c.name}</b> · <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}>{c.phone}</a>
              {c.note && <span className="muted"> · {c.note}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
