// Preguntas frecuentes derivadas de public/legal/terminos-y-condiciones.pdf.
// Si cambia el documento legal, actualiza estas respuestas para que no se contradigan.
// Los valores que en el PDF siguen entre corchetes (duración de la sesión, horas de
// anticipación, vigencia del saldo, días de reembolso) se omiten aquí hasta confirmarlos.

export interface FaqItem {
  id: string;
  question: string;
  answer: string[];
}

export interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "reservas",
    title: "Reservas, pagos y cancelaciones",
    items: [
      {
        id: "cuando-confirmada",
        question: "¿Cuándo queda confirmada mi cita?",
        answer: [
          "Tu cita queda confirmada solo cuando Payphone aprueba el pago y recibes tu código de reserva.",
        ],
      },
      {
        id: "llego-tarde",
        question: "¿Qué pasa si llego o me conecto tarde?",
        answer: [
          "La sesión termina a la hora prevista aunque llegues o te conectes tarde, por lo que el tiempo de atención se reduce.",
        ],
      },
      {
        id: "reprogramar-cancelar",
        question: "¿Puedo reprogramar o cancelar mi cita?",
        answer: [
          "Sí. Si lo haces con la anticipación indicada en los Términos y Condiciones, no tiene costo: el valor pagado se aplica a una nueva fecha o queda como saldo a favor para cualquier sesión.",
          "Si cancelas con menos anticipación o no te presentas, la sesión se considera realizada: no se reembolsa ni genera saldo a favor.",
        ],
      },
      {
        id: "reembolso",
        question: "¿En qué casos me devuelven el dinero?",
        answer: [
          "Solo cuando la sesión no se presta por causas atribuibles a Psicología y Mente: si el profesional cancela y prefieres no reprogramar, si una falla técnica de nuestra plataforma impide la sesión, o si hubo un cobro duplicado o erróneo.",
          "En esos casos se reembolsa el 100 % al mismo medio de pago, sujeto a los tiempos de Payphone y del banco. Esto no limita tus derechos según la Ley Orgánica de Defensa del Consumidor.",
        ],
      },
      {
        id: "datos-tarjeta",
        question: "¿Ustedes ven o guardan los datos de mi tarjeta?",
        answer: [
          "No. Los pagos se procesan en la pasarela de Payphone, que trata los datos de pago como responsable independiente y bajo su propia política de privacidad. Nosotros solo recibimos el monto, el estado y la referencia de la transacción.",
        ],
      },
      {
        id: "online",
        question: "¿Qué necesito para una sesión online?",
        answer: [
          "Una conexión estable y un espacio privado. Si la conexión falla por causas del profesional, la sesión se reprograma sin costo.",
          "Las sesiones online no se graban sin tu autorización expresa previa.",
        ],
      },
      {
        id: "emergencias",
        question: "¿Atienden emergencias?",
        answer: [
          "No. Este servicio no atiende emergencias. Ante una crisis o riesgo para tu vida, llama al ECU 911.",
          "La atención psicológica tampoco garantiza resultados específicos ni reemplaza la atención médica o psiquiátrica cuando sea necesaria.",
        ],
      },
    ],
  },
  {
    id: "confidencialidad",
    title: "Confidencialidad y secreto profesional",
    items: [
      {
        id: "quien-accede",
        question: "¿Quién puede ver lo que comparto en consulta?",
        answer: [
          "Todo lo que compartes en consulta es confidencial y está protegido por el secreto profesional y el código ético del psicólogo. Solo el profesional tratante accede a tu historia clínica; el personal administrativo solo ve los datos de agenda y pago, bajo acuerdo de confidencialidad.",
        ],
      },
      {
        id: "romper-confidencialidad",
        question: "¿En qué casos se puede romper la confidencialidad?",
        answer: [
          "Solo en estos casos: riesgo grave e inminente para tu vida o la de terceros; sospecha de violencia, abuso o maltrato contra niños, niñas, adolescentes u otras personas vulnerables cuando la ley obliga a denunciar; orden de autoridad judicial competente; o tu autorización expresa y por escrito.",
          "Aun así, se comparte únicamente la información estrictamente necesaria.",
        ],
      },
      {
        id: "despues-atencion",
        question: "¿La confidencialidad termina cuando dejo de ir a consulta?",
        answer: [
          "No. El deber de confidencialidad del profesional, del personal y de los proveedores se mantiene aun después de terminada la atención (art. 30 de la LOPDP).",
        ],
      },
    ],
  },
  {
    id: "datos",
    title: "Tus datos personales",
    items: [
      {
        id: "que-datos",
        question: "¿Qué datos personales recogen?",
        answer: [
          "Solo los necesarios para agendar, cobrar y prestar la atención: identificación, contacto, datos de la reserva, datos del pago (sin números de tarjeta), datos de salud generados durante la atención y datos técnicos como la IP, fecha y hora en que aceptaste el consentimiento.",
          "Los datos de salud son datos sensibles y reciben el nivel más alto de protección.",
        ],
      },
      {
        id: "venden-datos",
        question: "¿Venden o comparten mis datos?",
        answer: [
          "No vendemos, alquilamos ni cedemos tus datos con fines comerciales. Solo los compartimos con proveedores necesarios para prestar el servicio (alojamiento, videollamada, facturación electrónica), bajo contrato, y con autoridades cuando la ley lo exija.",
          "Ningún proveedor puede usar tus datos de salud para fines propios.",
        ],
      },
      {
        id: "dos-casillas",
        question: "¿Por qué debo marcar dos casillas antes de pagar?",
        answer: [
          "La LOPDP exige que el consentimiento para tratar datos de salud sea explícito y separado. Por eso aceptas por un lado los Términos y Condiciones y, por otro, el consentimiento informado y secreto profesional. Ninguna casilla viene marcada por defecto.",
          "Para cada casilla guardamos como prueba la versión del texto aceptado, la fecha, la hora y la dirección IP.",
        ],
      },
      {
        id: "revocar",
        question: "¿Puedo retirar mi consentimiento?",
        answer: [
          "Sí, en cualquier momento y sin costo, escribiendo a admin@psicologiaymente.com. La revocación no afecta los tratamientos ya realizados ni los datos que debemos conservar por ley (como la historia clínica), y puede impedir continuar con la atención.",
        ],
      },
      {
        id: "cuanto-tiempo",
        question: "¿Cuánto tiempo guardan mis datos?",
        answer: [
          "La historia clínica psicológica se conserva 15 años desde la última atención (5 en archivo activo y 10 en pasivo, según el MSP). Los datos de facturación, 7 años por obligación tributaria. La prueba del consentimiento, mientras dure la relación y hasta que prescriban las acciones legales. Los datos de promociones, hasta que retires tu consentimiento.",
          "Vencido el plazo, los datos se eliminan de forma segura o se anonimizan.",
        ],
      },
      {
        id: "seguridad",
        question: "¿Cómo protegen mis datos?",
        answer: [
          "Con conexión cifrada (HTTPS), cifrado de la historia clínica, notas clínicas separadas de tus datos de identificación, acceso por roles, registro de accesos, copias de respaldo y acuerdos de confidencialidad con el personal.",
          "Si ocurre un incidente que ponga en riesgo tus derechos, te lo notificaremos en un máximo de 3 días hábiles, indicando qué pasó y qué medidas se tomaron.",
        ],
      },
      {
        id: "derechos",
        question: "¿Qué derechos tengo sobre mis datos y cómo los ejerzo?",
        answer: [
          "Tienes derecho a información, acceso (incluida tu historia clínica), rectificación, eliminación, oposición, portabilidad, limitación del tratamiento y a no ser objeto de decisiones automatizadas.",
          "Escribe a admin@psicologiaymente.com con el asunto \"Derechos LOPDP\", indicando tu nombre, cédula, el derecho que deseas ejercer y una copia de tu documento de identidad. El trámite es gratuito y respondemos en un máximo de 15 días.",
        ],
      },
      {
        id: "reclamar",
        question: "¿Dónde presento un reclamo?",
        answer: [
          "Primero ante nosotros, en admin@psicologiaymente.com. Si no te respondemos a tiempo o no estás conforme, puedes acudir a la Superintendencia de Protección de Datos Personales del Ecuador.",
        ],
      },
    ],
  },
  {
    id: "menores",
    title: "Menores de edad",
    items: [
      {
        id: "atienden-menores",
        question: "¿Atienden a menores de edad?",
        answer: [
          "Sí, con el consentimiento de su padre, madre o tutor legal, que es el único que puede agendar sus citas. El menor no crea una cuenta propia: se registra como dependiente en la cuenta de su representante.",
          "Aplicamos esta regla a todos los menores de 18 años, aunque la LOPDP permite que los adolescentes desde los 15 consientan por sí mismos. Podemos pedir documentos que acrediten la representación.",
        ],
      },
      {
        id: "adolescente",
        question: "Soy adolescente, ¿mis papás sabrán lo que hablo en consulta?",
        answer: [
          "Lo que conversas en consulta es confidencial. Con tus padres o tutores solo se comparte lo necesario para tu cuidado, y te lo diremos antes.",
          "Solo se rompe la confidencialidad si tu vida o la de otra persona corre peligro, si alguien te está haciendo daño o si un juez lo ordena. Si tienes dudas, pregúntale a tu psicólogo/a.",
        ],
      },
    ],
  },
];
