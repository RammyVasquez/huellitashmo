// Guía de primeros auxilios compartida por una colaboradora del proyecto.
// Solo se corrigieron erratas y se unificó el tuteo; el contenido no se modificó.
export type Emergencia = { id: string; titulo: string; pasos: string[] };

export const EMERGENCIAS: Emergencia[] = [
  {
    id: "sangrado-activo",
    titulo: "Sangrado activo",
    pasos: [
      "Colocar gasa o tela limpia directamente sobre la herida.",
      "Aplicar presión firme y continua durante 5–10 min sin levantar para “revisar”.",
      "Si se empapa, colocar más material encima sin retirar el primero.",
      "No quitar coágulos, no hacer torniquetes salvo una hemorragia de una extremidad que sea potencialmente mortal y no responda a presión. No poner alcohol, agua oxigenada ni polvos sobre la herida.",
      "Mantener al paciente tranquilo y trasladar de urgencia al veterinario.",
    ],
  },
  {
    id: "vía-aérea",
    titulo: "Se ahoga con un hueso u objeto",
    pasos: [
      "Mantener la calma y abrir la boca. Si el objeto está claramente visible y se puede retirar fácilmente, extraerlo con cuidado.",
      "Si no puede respirar y el objeto no sale, realizar maniobras de desobstrucción según el tamaño del animal.",
      "Si pierde la conciencia, iniciar RCP si no respira normalmente. Puedes colocar una tela ligera sobre nariz y boca y hacer ventilaciones controladas.",
      "No meter los dedos a ciegas, no empujar el objeto hacia la garganta, no ofrecer agua/comida.",
      "Trasladar inmediatamente a urgencias, intenta localizar una clínica que cuente con rayos X por si fuera necesario y no perder tiempo valioso.",
    ],
  },
  {
    id: "colapso",
    titulo: "Inconsciencia o colapso",
    pasos: [
      "Comprobar si respira.",
      "Revisar rápidamente la boca y retirar únicamente una obstrucción visible.",
      "Si no respira normalmente, iniciar RCP y trasladar inmediatamente.",
      "Si respira, mantenerlo de lado, con vía aérea libre y cabeza/cuello alineados, evitando movimientos innecesarios.",
      "No dar comida, agua ni medicamentos, no sacudirlo, no meter objetos en la boca, no dejarlo solo.",
      "Trasladarlo a clínica, es una emergencia médica.",
    ],
  },
  {
    id: "golpe-de-calor",
    titulo: "Golpe de calor",
    pasos: [
      "Sacarlo inmediatamente del ambiente caliente.",
      "Iniciar enfriamiento activo con agua fresca/templada y ventilación. No empapar a la mascota, hacerlo de forma controlada. Mojar principalmente abdomen, ingles, axilas y patas.",
      "Ofrecer pequeñas cantidades de agua solo si está consciente y puede tragar normalmente. No obligarlo a beber.",
      "No utilizar hielo o agua extremadamente fría sobre todo el cuerpo y no envolverlo en toallas mojadas que retengan el calor.",
      "No esperar a que “se le pase”, acudir al veterinario inmediatamente aunque parezca recuperarse, es una emergencia médica.",
    ],
  },
  {
    id: "envenenamiento",
    titulo: "Envenenamiento o intoxicación",
    pasos: [
      "Retirar al animal de la fuente.",
      "Guardar el envase, etiqueta, planta, alimento o sustancia involucrada.",
      "Anotar aproximadamente qué consumió, cuánto y a qué hora.",
      "No inducir el vómito por cuenta propia, no dar leche, aceite, sal, limón ni remedios caseros.",
      "No administrar carbón activado sin indicación veterinaria, puedes llamar a su veterinario para saber si puedes ofrecerlo mientras llegas a la clínica.",
      "Llamar al veterinario mientras se prepara el traslado, localiza veterinarias en las que puedas acudir antes de 15-20 minutos para su atención.",
    ],
  },
  {
    id: "fractura",
    titulo: "Fractura o traumatismo",
    pasos: [
      "Evitar que camine o salte.",
      "Inmovilizar la parte afectada.",
      "Transportar sobre una superficie firme si existe sospecha de lesión de columna o cadera.",
      "Si hay herida abierta, cubrirla con una gasa limpia.",
      "No intentar “acomodar” el hueso ni masajear, no hacer férulas apretadas si no se sabe colocarlas, no permitir que camine para “probar”.",
      "Trasladar de inmediato a urgencias, intenta localizar veterinarias que cuenten con rayos X para no perder tiempo valioso.",
    ],
  },
  {
    id: "sangrado-nasal",
    titulo: "Sangrado nasal",
    pasos: [
      "Mantenerlo tranquilo.",
      "Mantener la cabeza en posición normal, no elevarla.",
      "Colocar una compresa fría sobre el puente de la nariz/hocico.",
      "No introducir algodón, papel u objetos profundamente en las fosas nasales, no administrar medicamentos humanos.",
      "Trasladar al veterinario.",
    ],
  },
];
