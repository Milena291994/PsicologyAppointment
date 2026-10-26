import { AppConfig, Appointment, WeeklySchedule } from "@/types";
import { formatDateKey } from "@/lib/date";

// Horario de los terapeutas demo (SPEC 02): lunes a sábado 08:00–18:00, citas de 60 min, domingo sin atención.
const MOCK_CLOSED_DAYS = [0];
const MOCK_INTERVAL_MINUTES = 60;
/** Horarios que genera ese rango con intervalo 60 (08:00 AM … 05:00 PM); las citas semilla deben caer en ellos. */
const MOCK_SLOT_LABELS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

function mockWeeklySchedule(): WeeklySchedule {
  const schedule: WeeklySchedule = {};
  for (let day = 0; day <= 6; day++) {
    schedule[day] = MOCK_CLOSED_DAYS.includes(day) ? null : { start: "08:00", end: "18:00" };
  }
  return schedule;
}

export const APP_CONFIG: AppConfig = {
  clinicName: "Psicología y Mente",
  specialists: [
    {
      id: "sp1",
      name: "Dra. Valentina Paredes M.",
      title: "Psicóloga Clínica • M.Sc. Neuropsicología y Terapia Cognitivo-Conductual",
      registry: "Reg. Sanitario MSP #PS-48201",
      avatar: "https://images.unsplash.com/photo-1594824813501-489502213793?auto=format&fit=crop&q=80&w=260&h=260",
      rating: 4.98,
      reviewsCount: 142,
      experienceYears: 9,
      about: "Especialista en trastornos del estado de ánimo, ansiedad generalizada, manejo del estrés y desarrollo personal. Mi enfoque combina la escucha empática con herramientas basadas en evidencia clínica en un entorno seguro y libre de juicios.",
      sessionDuration: "50 minutos",
      price: 45.0,
      currency: "USD",
      currencySymbol: "$",
      languages: ["Español", "English"],
      active: true,
      weeklySchedule: mockWeeklySchedule(),
      slotIntervalMinutes: MOCK_INTERVAL_MINUTES,
      cancelledDates: [],
      timeBlocks: []
    },
    {
      id: "sp2",
      name: "Dr. Andrés Felipe Torres B.",
      title: "Psicólogo Clínico • Esp. Terapia de Pareja y Familia",
      registry: "Reg. Sanitario MSP #PS-51937",
      avatar: "https://images.unsplash.com/photo-1618077360395-f3068be8e001?auto=format&fit=crop&q=80&w=260&h=260",
      rating: 4.86,
      reviewsCount: 98,
      experienceYears: 12,
      about: "Especialista en terapia de pareja, dinámica familiar y comunicación en relaciones afectivas. Trabaja con un enfoque sistémico centrado en soluciones prácticas y sostenibles.",
      sessionDuration: "50 minutos",
      price: 50.0,
      currency: "USD",
      currencySymbol: "$",
      languages: ["Español"],
      active: true,
      weeklySchedule: mockWeeklySchedule(),
      slotIntervalMinutes: MOCK_INTERVAL_MINUTES,
      cancelledDates: [],
      timeBlocks: []
    },
    {
      id: "sp3",
      name: "Dra. Gabriela Ontaneda R.",
      title: "Psicóloga Infanto-Juvenil • Esp. Desarrollo y Aprendizaje",
      registry: "Reg. Sanitario MSP #PS-46810",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=260&h=260",
      rating: 4.91,
      reviewsCount: 76,
      experienceYears: 7,
      about: "Especialista en psicología infanto-juvenil, dificultades de aprendizaje y acompañamiento a adolescentes. Ofrece un espacio cálido y seguro para pacientes menores de edad y sus familias.",
      sessionDuration: "50 minutos",
      price: 38.0,
      currency: "USD",
      currencySymbol: "$",
      languages: ["Español", "English"],
      active: true,
      weeklySchedule: mockWeeklySchedule(),
      slotIntervalMinutes: MOCK_INTERVAL_MINUTES,
      cancelledDates: [],
      timeBlocks: []
    }
  ],
  payphone: {
    paymentUrl: "https://payphone.app/",
    merchantName: "Psicología y Mente",
    taxIncluded: true
  },
  termsUrl: `${import.meta.env.BASE_URL}legal/terminos-y-condiciones.pdf`,
  // Demo login credentials (no backend — see CLAUDE.md): cédula + password "1234" for any seeded patient below.
  registeredPatients: [
    {
      id: "p1",
      identification: "1723456789",
      firstName: "Camila Andrea",
      lastName: "Vega Morales",
      fullName: "Camila Andrea Vega Morales",
      email: "camila.vega@ejemplo.com",
      phone: "+593 99 123 4567",
      birthDate: "1994-06-15",
      preferredModality: "online",
      consultReason: "Ansiedad y estrés",
      isReturning: true,
      notes: "Paciente frecuente • Última sesión hace 21 días",
      password: "1234"
    },
    {
      id: "p2",
      identification: "0987654321",
      firstName: "Mateo Sebastián",
      lastName: "Rivas Gómez",
      fullName: "Mateo Sebastián Rivas Gómez",
      email: "mateo.rivas@ejemplo.com",
      phone: "+593 98 765 4321",
      birthDate: "1988-11-23",
      preferredModality: "presencial",
      consultReason: "Duelo y pérdida",
      isReturning: true,
      notes: "Paciente en seguimiento regular",
      password: "1234"
    },
    {
      id: "p3",
      identification: "1104567890",
      firstName: "Lucía Fernanda",
      lastName: "Cordero",
      fullName: "Lucía Fernanda Cordero",
      email: "lucia.cordero@ejemplo.com",
      phone: "+593 96 543 2198",
      birthDate: "2001-03-08",
      preferredModality: "online",
      consultReason: "Crecimiento personal",
      isReturning: true,
      notes: "Sesión de control",
      password: "1234"
    }
  ],
  // Demo login de terapeutas (pestaña "Terapeuta" en /login): cédula + password "1234".
  therapistAccounts: [
    { specialistId: "sp1", identification: "1711111111", password: "1234" },
    { specialistId: "sp2", identification: "1722222222", password: "1234" },
    { specialistId: "sp3", identification: "1733333333", password: "1234" }
  ],
  // Demo login de administración (/admin/login): cédula + password "1234".
  adminAccounts: [
    { id: "adm1", name: "Administración Psicología y Mente", identification: "0999999999", password: "1234" }
  ]
};

/** Fecha a `offset` días de hoy; si cae en un día cerrado, avanza al siguiente día hábil. */
function workingDayFromToday(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  while (MOCK_CLOSED_DAYS.includes(date.getDay())) {
    date.setDate(date.getDate() + 1);
  }
  return formatDateKey(date);
}

const [camila, mateo, lucia] = APP_CONFIG.registeredPatients;

function priceOf(therapistId: string): number {
  return APP_CONFIG.specialists.find((s) => s.id === therapistId)?.price ?? 0;
}

/** El pago se registra `paidDaysBefore` días antes de la sesión, nunca en el futuro. */
function paidAtFor(dateKey: string, paidDaysBefore: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const paid = new Date(y, m - 1, d - paidDaysBefore, 10, 0);
  const now = new Date();
  return (paid > now ? now : paid).toISOString();
}

function seed(
  n: number,
  patient: typeof camila,
  therapistId: string,
  dayOffset: number,
  timeLabel: string,
  modality: Appointment["modality"]
): Appointment {
  const date = workingDayFromToday(dayOffset);
  return {
    id: `apt-seed-${n}`,
    attendeeType: "patient",
    attendeeId: patient.id,
    attendeeName: patient.fullName,
    attendeeIdentification: patient.identification,
    therapistId,
    date,
    timeLabel,
    modality,
    bookingCode: `CS-${100200 + n}`,
    status: "active",
    amountPaid: priceOf(therapistId),
    createdAt: paidAtFor(date, 2)
  };
}

/**
 * Sesiones ya atendidas en los últimos `days` días, generadas de forma determinista
 * para que la pantalla de ingresos del terapeuta tenga historial en la demo.
 */
function pastSeeds(therapistId: string, therapistIndex: number, days: number): Appointment[] {
  const patients = [camila, mateo, lucia];
  const result: Appointment[] = [];

  for (let offset = 1; offset <= days; offset++) {
    const day = new Date();
    day.setDate(day.getDate() - offset);
    if (MOCK_CLOSED_DAYS.includes(day.getDay())) continue;

    const dateKey = formatDateKey(day);
    const sessions = (offset * 7 + therapistIndex * 3) % 4; // 0–3 sesiones al día
    for (let i = 0; i < sessions; i++) {
      const n = result.length;
      const patient = patients[(offset + i + therapistIndex) % patients.length];
      const timeLabel = MOCK_SLOT_LABELS[(offset * 3 + i * 4 + therapistIndex) % MOCK_SLOT_LABELS.length];
      result.push({
        id: `apt-hist-${therapistId}-${n}`,
        attendeeType: "patient",
        attendeeId: patient.id,
        attendeeName: patient.fullName,
        attendeeIdentification: patient.identification,
        therapistId,
        date: dateKey,
        timeLabel,
        modality: (offset + i) % 3 === 0 ? "presencial" : "online",
        bookingCode: `CS-${300000 + therapistIndex * 10000 + n}`,
        status: "active",
        amountPaid: priceOf(therapistId),
        createdAt: paidAtFor(dateKey, 1 + ((offset + i) % 4))
      });
    }
  }
  return result;
}

// Citas precargadas (relativas a hoy) para que la agenda del terapeuta tenga contenido en la demo.
export const SEED_APPOINTMENTS: Appointment[] = [
  ...APP_CONFIG.specialists.flatMap((s, index) => pastSeeds(s.id, index, 180)),
  seed(1, camila, "sp1", 0, "09:00 AM", "online"),
  seed(2, mateo, "sp1", 0, "11:00 AM", "presencial"),
  seed(3, lucia, "sp1", 0, "04:00 PM", "online"),
  seed(4, mateo, "sp1", 1, "08:00 AM", "presencial"),
  seed(5, camila, "sp1", 3, "03:00 PM", "online"),
  seed(6, lucia, "sp2", 0, "10:00 AM", "presencial"),
  seed(7, camila, "sp2", 2, "05:00 PM", "online"),
  seed(8, mateo, "sp3", 1, "02:00 PM", "online")
];
