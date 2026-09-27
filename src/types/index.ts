/**
 * Definiciones de tipos para el Portal de Citas Psicológicas
 * Psicología y Mente
 */

export type Modality = "online" | "presencial";

export interface Specialist {
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

export interface Patient {
  id: string;
  identification: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate?: string;
  preferredModality: Modality;
  consultReason: string;
  isReturning: boolean;
  notes?: string;
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
  specialist: Specialist;
  payphone: {
    paymentUrl: string;
    merchantName: string;
    taxIncluded: boolean;
  };
  registeredPatients: Patient[];
  defaultSlots: TimeSlot[];
  disabledDaysOfWeek: number[];
}
