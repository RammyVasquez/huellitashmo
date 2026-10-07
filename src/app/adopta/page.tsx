import Link from "next/link";

export const metadata = { title: "Cómo adoptar · Huellitas HMO" };

export default function ComoAdoptar() {
  return (
    <div className="wrap page">
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Cómo adoptar, paso a paso</h1>
      <p className="lead">
        Adoptar es un compromiso de muchos años. Por eso cada refugio te hará algunas preguntas: quieren que
        el animal llegue a un hogar donde se quede para siempre.
      </p>

      <ol className="steps" style={{ marginTop: "2rem" }}>
        <li><div><h3>Conoce a quien espera</h3><p>Revisa los perfiles en <Link href="/animales">Adopta</Link>. Piensa en tu espacio, tu tiempo y tu rutina: un perro activo pide paseos diarios, un gato adulto suele ser más independiente.</p></div></li>
        <li><div><h3>Escribe al refugio</h3><p>Desde la ficha del animal te conectamos por WhatsApp con el refugio. Cuéntales quién vive en tu casa y qué buscas.</p></div></li>
        <li><div><h3>Visita y convive</h3><p>Ve a conocerlo en persona. Si tienes otros animales o niños en casa, pregunta si es posible una presentación.</p></div></li>
        <li><div><h3>Firma el compromiso</h3><p>El refugio te pedirá una identificación y un compromiso de cuidado: alimentación, atención veterinaria, vacunas y esterilización o castración si aún no la tiene.</p></div></li>
        <li><div><h3>Llévalo a casa y mantén el contacto</h3><p>Los primeros días son de adaptación. Avisa al refugio cómo va; muchos piden una foto después de algunas semanas y eso ayuda a mostrar que adoptar funciona.</p></div></li>
      </ol>

      <section className="section">
        <h2>Lo que suelen pedir los refugios</h2>
        <p className="muted">Cada refugio define sus propios requisitos. Esto es lo más común:</p>
        <ul>
          <li>Ser mayor de edad y mostrar una identificación oficial.</li>
          <li>Que todas las personas de tu casa estén de acuerdo. Si rentas, contar con permiso del propietario.</li>
          <li>Un espacio seguro, sin riesgo de escape, y que el animal viva dentro del hogar o con refugio del calor.</li>
          <li>Compromiso de esterilizar o castrar y vacunar, y de no regalar, vender ni abandonar al animal. Si ya no puedes cuidarlo, regresarlo al refugio.</li>
        </ul>
      </section>

      <section className="section">
        <h2>Preguntas frecuentes</h2>
        <details>
          <summary>¿Cuánto cuesta adoptar?</summary>
          <p>Depende del refugio. Algunos piden una cuota de recuperación o que entregues el animal esterilizado o castrado. Esta plataforma no cobra nada ni maneja dinero: pregunta directo al refugio.</p>
        </details>
        <details>
          <summary>¿Puedo adoptar si vivo en un departamento?</summary>
          <p>Sí, muchas personas lo hacen. Importa más que el animal tenga ejercicio, compañía y que tu contrato o reglamento lo permita.</p>
        </details>
        <details>
          <summary>¿Y si no se adapta?</summary>
          <p>Es normal que tome tiempo. Habla con el refugio: pueden orientarte. Si de verdad no funciona, regrésalo a ellos y nunca lo dejes en la calle.</p>
        </details>
        <details>
          <summary>¿Por qué me piden esterilizarlo o castrarlo?</summary>
          <p>La sobrepoblación es la causa de fondo de los animales en la calle. Esterilizar o castrar evita camadas no deseadas y mejora la salud del animal.</p>
        </details>
      </section>

      <div className="actions" style={{ marginTop: "2rem" }}>
        <Link className="btn" href="/animales">Ver animales en adopción</Link>
        <Link className="btn ghost" href="/donar">Si no puedes adoptar, dona en especie</Link>
      </div>
    </div>
  );
}
