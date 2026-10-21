/**
 * Definiciones de tipos para el Portal de Citas Psicológicas
 * Psicología y Mente
 */

export type Modality = "online" | "presencial";

export interface Specialist {
  id: string;
  name: string;
  title: string;
  registry: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  about: string;
  sessionDuration: string;
  price: number;
  currency: string;
  currencySymbol: string;
  languages: string[];
  /** false = oculto al reservar/reprogramar y sin acceso al login. */
  active: boolean;
  weeklySchedule: WeeklySchedule;
  /** Duración de cada cita en minutos (múltiplo de 5, 15–180); también es el paso entre citas (sin descansos). */
  slotIntervalMinutes: number;
  /** Fechas (YYYY-MM-DD) que el terapeuta canceló completas; no aceptan reservas. */
  cancelledDates: string[];
  /** Tramos bloqueados en fechas concretas; los horarios que se solapan no se ofrecen. */
  timeBlocks: TimeBlock[];
}

export type AppointmentStatus = "active" | "cancelled";

/** Rango de atención de un día, horas "HH:mm" en 24 h. */
export interface DayRange {
  start: string;
  end: string;
}

/** 0 = domingo … 6 = sábado; null = ese día no atiende. */
export type WeeklySchedule = Record<number, DayRange | null>;

/** Tramo bloqueado en una fecha concreta, horas "HH:mm" en 24 h. */
export interface TimeBlock {
  date: string;
  start: string;
  end: string;
}

export type Sex = "femenino" | "masculino" | "intersexual" | "no_indica";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

/** Datos complementarios del perfil, editables por el paciente desde "Mi perfil". */
export interface PatientProfile {
  sex?: Sex;
  genderIdentity?: string;
  pronouns?: string;
  city?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
}

export interface Patient extends PatientProfile {
  id: string;
  identification: string;
  firstName: string;
  lastName: string;
  /** Nombres + apellidos, derivado para mostrar en la UI. */
  fullName: string;
  email: string;
  phone: string;
  birthDate?: string;
  preferredModality: Modality;
  consultReason: string;
  isReturning: boolean;
  notes?: string;
  /** Demo-only mock credential — this app has no backend, see CLAUDE.md. */
  password: string;
}

export interface Dependent {
  id: string;
  identification: string;
  fullName: string;
  birthDate: string;
  consultReason: string;
}

export type UserRole = "patient" | "therapist" | "admin";

/** Cuenta de administrador (login en /admin/login). Demo-only, ver CLAUDE.md. */
export interface AdminAccount {
  id: string;
  name: string;
  identification: string;
  password: string;
}

/** Credenciales de acceso de un terapeuta, vinculadas a su ficha en `specialists`. Demo-only, ver CLAUDE.md. */
export interface TherapistAccount {
  specialistId: string;
  identification: string;
  password: string;
}

export interface Appointment {
  id: string;
  attendeeType: "patient" | "dependent";
  attendeeId: string;
  attendeeName: string;
  /** Cédula del paciente o dependiente que asiste; el terapeuta filtra su agenda por ella. */
  attendeeIdentification: string;
  therapistId: string | null;
  date: string;
  timeLabel: string;
  modality: Modality;
  bookingCode: string;
  /** Monto cobrado vía Payphone al agendar (USD, IVA 0%); se congela aunque luego cambie la tarifa. */
  amountPaid: number;
  /** Momento del pago (ISO); la pantalla de ingresos agrupa por esta fecha, no por la de la sesión. */
  createdAt: string;
  status: AppointmentStatus;
  /** Momento de la cancelación (ISO); se borra al reprogramar. */
  cancelledAt?: string;
}

/** Lo mínimo de una cita para calcular disponibilidad; es lo único que se expone de citas ajenas. */
export type BusySlot = Pick<Appointment, "id" | "therapistId" | "date" | "timeLabel" | "status">;

export interface AttendeeSelection {
  type: "patient" | "dependent";
  id: string;
  name: string;
}

export interface PatientFormData {
  identification: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  consultReason: string;
  firstTimeTherapy: "si" | "no";
  acceptedTerms: boolean;
  // Consentimiento separado para datos de salud (LOPDP arts. 8 y 26): no puede ir unido a los términos del servicio.
  acceptedDataProcessing: boolean;
}

export interface TimeSlot {
  time: string;
  period: "morning" | "afternoon";
  label: string;
}

export interface TentativeDate {
  dateKey: string;
  dateObj: Date;
  displayDay: string;
  badgeLabel: string;
}

export interface AppConfig {
  clinicName: string;
  specialists: Specialist[];
  payphone: {
    paymentUrl: string;
    merchantName: string;
    taxIncluded: boolean;
  };
  // Ruta pública del PDF de Términos y Condiciones y Política de Protección de Datos.
  termsUrl: string;
  registeredPatients: Patient[];
  therapistAccounts: TherapistAccount[];
  adminAccounts: AdminAccount[];
}
