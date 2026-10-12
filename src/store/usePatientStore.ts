import { create } from "zustand";
import { Patient, PatientProfile, Dependent, Appointment, Modality } from "@/types";
import { APP_CONFIG } from "@/data/mockData";
import { isMinor } from "@/lib/age";

export interface RegisterInput {
  identification: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
}

/** Campos editables desde "Mi perfil"; nombres, cédula y fecha de nacimiento quedan fuera a propósito. */
export type ProfileInput = PatientProfile & { email: string; phone: string };

export interface DependentInput {
  identification: string;
  fullName: string;
  birthDate: string;
  consultReason: string;
}

export interface AppointmentInput {
  attendeeType: "patient" | "dependent";
  attendeeId: string;
  attendeeName: string;
  therapistId: string | null;
  date: string;
  timeLabel: string;
  modality: Modality;
  bookingCode: string;
}

interface PatientStoreState {
  patients: Patient[];
  currentPatient: (Patient & { dependents: Dependent[] }) | null;
  isAuthenticated: boolean;
  appointments: Appointment[];
  /** Dependientes guardados por cada paciente, para que se recuperen al iniciar sesión. */
  dependentsByPatientId: Record<string, Dependent[]>;

  login: (identification: string, password: string) => boolean;
  logout: () => void;
  register: (data: RegisterInput) => { ok: boolean; error?: string };
  updateContactInfo: (email: string, phone: string, consultReason: string) => void;
  updateProfile: (data: ProfileInput) => void;
  addDependent: (data: DependentInput) => { ok: boolean; error?: string };
  updateDependent: (id: string, data: DependentInput) => { ok: boolean; error?: string };
  addAppointment: (appt: AppointmentInput) => void;
  rescheduleAppointment: (id: string, therapistId: string, date: string, timeLabel: string) => void;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export const usePatientStore = create<PatientStoreState>((set, get) => ({
  patients: [...APP_CONFIG.registeredPatients],
  currentPatient: null,
  isAuthenticated: false,
  appointments: [],
  dependentsByPatientId: {},

  login: (identification, password) => {
    const match = get().patients.find(
      (p) => p.identification === identification.trim() && p.password === password
    );
    if (!match) return false;

    const dependents = get().dependentsByPatientId[match.id] || [];
    set({
      currentPatient: { ...match, dependents },
      isAuthenticated: true,
    });
    return true;
  },

  logout: () => {
    set({ currentPatient: null, isAuthenticated: false });
  },

  register: (data) => {
    if (isMinor(data.birthDate)) {
      return { ok: false, error: "Los menores de edad no pueden registrarse en la plataforma." };
    }

    const exists = get().patients.some((p) => p.identification === data.identification.trim());
    if (exists) {
      return { ok: false, error: "Ya existe una cuenta registrada con esa cédula. Inicia sesión." };
    }

    const newPatient: Patient = {
      id: nextId("p"),
      identification: data.identification.trim(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
      email: data.email.trim(),
      phone: data.phone.trim(),
      birthDate: data.birthDate,
      preferredModality: "online",
      // El motivo de consulta (dato de salud) se pide recién al agendar, no al registrarse.
      consultReason: "",
      isReturning: false,
      password: data.password,
    };

    set((state) => ({
      patients: [...state.patients, newPatient],
      currentPatient: { ...newPatient, dependents: [] },
      isAuthenticated: true,
      dependentsByPatientId: { ...state.dependentsByPatientId, [newPatient.id]: [] },
    }));

    return { ok: true };
  },

  updateContactInfo: (email, phone, consultReason) => {
    set((state) => {
      if (!state.currentPatient) return state;
      const updatedCurrent = { ...state.currentPatient, email, phone, consultReason };
      const updatedPatients = state.patients.map((p) =>
        p.id === updatedCurrent.id ? { ...p, email, phone, consultReason } : p
      );
      return { currentPatient: updatedCurrent, patients: updatedPatients };
    });
  },

  updateProfile: (data) => {
    set((state) => {
      if (!state.currentPatient) return state;
      const updatedCurrent = { ...state.currentPatient, ...data };
      const updatedPatients = state.patients.map((p) => (p.id === updatedCurrent.id ? { ...p, ...data } : p));
      return { currentPatient: updatedCurrent, patients: updatedPatients };
    });
  },

  addDependent: (data) => {
    if (!isMinor(data.birthDate)) {
      return { ok: false, error: "Los dependientes deben ser menores de edad." };
    }

    const dependent: Dependent = {
      id: nextId("dep"),
      identification: data.identification.trim(),
      fullName: data.fullName.trim(),
      birthDate: data.birthDate,
      consultReason: data.consultReason,
    };

    set((state) => {
      if (!state.currentPatient) return state;
      const dependents = [...state.currentPatient.dependents, dependent];
      return {
        currentPatient: { ...state.currentPatient, dependents },
        dependentsByPatientId: { ...state.dependentsByPatientId, [state.currentPatient.id]: dependents },
      };
    });

    return { ok: true };
  },

  updateDependent: (id, data) => {
    if (!isMinor(data.birthDate)) {
      return { ok: false, error: "Los dependientes deben ser menores de edad." };
    }

    set((state) => {
      if (!state.currentPatient) return state;
      const dependents = state.currentPatient.dependents.map((dep) =>
        dep.id === id
          ? {
              ...dep,
              identification: data.identification.trim(),
              fullName: data.fullName.trim(),
              birthDate: data.birthDate,
              consultReason: data.consultReason,
            }
          : dep
      );
      return {
        currentPatient: { ...state.currentPatient, dependents },
        dependentsByPatientId: { ...state.dependentsByPatientId, [state.currentPatient.id]: dependents },
      };
    });

    return { ok: true };
  },

  addAppointment: (appt) => {
    const appointment: Appointment = {
      ...appt,
      id: nextId("apt"),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ appointments: [...state.appointments, appointment] }));
  },

  rescheduleAppointment: (id, therapistId, date, timeLabel) => {
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, therapistId, date, timeLabel } : a
      ),
    }));
  },
}));
