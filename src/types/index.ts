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

export interface Appointment {
  id: string;
  attendeeType: "patient" | "dependent";
  attendeeId: string;
  attendeeName: string;
  therapistId: string | null;
  date: string;
  timeLabel: string;
  modality: Modality;
  bookingCode: string;
  createdAt: string;
}

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
  defaultSlots: TimeSlot[];
  disabledDaysOfWeek: number[];
}
