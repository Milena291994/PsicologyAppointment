import { AppConfig } from "@/types";

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
      languages: ["Español", "English"]
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
      languages: ["Español"]
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
      languages: ["Español", "English"]
    }
  ],
  payphone: {
    paymentUrl: "https://payphone.app/",
    merchantName: "Psicología y Mente",
    taxIncluded: true
  },
  termsUrl: "/legal/terminos-y-condiciones.pdf",
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
  defaultSlots: [
    { time: "08:30", period: "morning", label: "08:30 AM" },
    { time: "09:30", period: "morning", label: "09:30 AM" },
    { time: "10:30", period: "morning", label: "10:30 AM" },
    { time: "11:30", period: "morning", label: "11:30 AM" },
    { time: "14:00", period: "afternoon", label: "02:00 PM" },
    { time: "15:00", period: "afternoon", label: "03:00 PM" },
    { time: "16:00", period: "afternoon", label: "04:00 PM" },
    { time: "17:00", period: "afternoon", label: "05:00 PM" },
    { time: "18:00", period: "afternoon", label: "06:00 PM" }
  ],
  disabledDaysOfWeek: [0] // Domingo cerrado
};
