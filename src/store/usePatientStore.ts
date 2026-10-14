import { create } from "zustand";
import {
  AdminAccount,
  Patient,
  PatientProfile,
  Dependent,
  Appointment,
  Modality,
  Specialist,
  TherapistAccount,
  UserRole,
} from "@/types";
import { APP_CONFIG, SEED_APPOINTMENTS } from "@/data/mockData";
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

/** Datos del formulario de terapeutas del admin. */
export interface TherapistInput {
  name: string;
  title: string;
  registry: string;
  experienceYears: number;
  price: number;
  identification: string;
  /** Obligatoria al crear; al editar, "" = mantener la actual. */
  password: string;
}

export interface AppointmentInput {
  attendeeType: "patient" | "dependent";
  attendeeId: string;
  attendeeName: string;
  attendeeIdentification: string;
  therapistId: string | null;
  date: string;
  timeLabel: string;
  modality: Modality;
  bookingCode: string;
  amountPaid: number;
}

interface PatientStoreState {
  patients: Patient[];
  currentPatient: (Patient & { dependents: Dependent[] }) | null;
  /** Terapeuta en sesión (rol "therapist"); excluyente con `currentPatient`. */
  currentTherapist: Specialist | null;
  /** Administrador en sesión (rol "admin"); excluyente con `currentPatient` y `currentTherapist`. */
  currentAdmin: AdminAccount | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  appointments: Appointment[];
  /** Dependientes guardados por cada paciente, para que se recuperen al iniciar sesión. */
  dependentsByPatientId: Record<string, Dependent[]>;
  /** Terapeutas gestionados por el admin; inicializados desde `APP_CONFIG`, que queda solo como estado inicial. */
  specialists: Specialist[];
  therapistAccounts: TherapistAccount[];

  login: (identification: string, password: string) => boolean;
  loginTherapist: (identification: string, password: string) => boolean;
  loginAdmin: (identification: string, password: string) => boolean;
  logout: () => void;
  register: (data: RegisterInput) => { ok: boolean; error?: string };
  updateContactInfo: (email: string, phone: string, consultReason: string) => void;
  updateProfile: (data: ProfileInput) => void;
  addDependent: (data: DependentInput) => { ok: boolean; error?: string };
  updateDependent: (id: string, data: DependentInput) => { ok: boolean; error?: string };
  addAppointment: (appt: AppointmentInput) => void;
  rescheduleAppointment: (
    id: string,
    therapistId: string,
    date: string,
    timeLabel: string
  ) => { ok: boolean; error?: string };
  createTherapist: (data: TherapistInput) => { ok: boolean; error?: string };
  updateTherapist: (id: string, data: TherapistInput) => { ok: boolean; error?: string };
  setTherapistActive: (id: string, active: boolean) => void;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export const usePatientStore = create<PatientStoreState>((set, get) => ({
  patients: [...APP_CONFIG.registeredPatients],
  currentPatient: null,
  currentTherapist: null,
  currentAdmin: null,
  role: null,
  isAuthenticated: false,
  appointments: [...SEED_APPOINTMENTS],
  dependentsByPatientId: {},
  specialists: [...APP_CONFIG.specialists],
  therapistAccounts: [...APP_CONFIG.therapistAccounts],

  login: (identification, password) => {
    const match = get().patients.find(
      (p) => p.identification === identification.trim() && p.password === password
    );
    if (!match) return false;

    const dependents = get().dependentsByPatientId[match.id] || [];
    set({
      currentPatient: { ...match, dependents },
      currentTherapist: null,
      currentAdmin: null,
      role: "patient",
      isAuthenticated: true,
    });
    return true;
  },

  loginTherapist: (identification, password) => {
    const account = get().therapistAccounts.find(
      (a) => a.identification === identification.trim() && a.password === password
    );
    const specialist = account && get().specialists.find((sp) => sp.id === account.specialistId);
    // Un terapeuta desactivado por el admin no puede iniciar sesión.
    if (!specialist || !specialist.active) return false;

    set({
      currentTherapist: specialist,
      currentPatient: null,
      currentAdmin: null,
      role: "therapist",
      isAuthenticated: true,
    });
    return true;
  },

  loginAdmin: (identification, password) => {
    const admin = APP_CONFIG.adminAccounts.find(
      (a) => a.identification === identification.trim() && a.password === password
    );
    if (!admin) return false;

    set({ currentAdmin: admin, currentPatient: null, currentTherapist: null, role: "admin", isAuthenticated: true });
    return true;
  },

  logout: () => {
    set({ currentPatient: null, currentTherapist: null, currentAdmin: null, role: null, isAuthenticated: false });
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
      currentTherapist: null,
      currentAdmin: null,
      role: "patient",
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
    const taken = get().appointments.some(
      (a) => a.id !== id && a.therapistId === therapistId && a.date === date && a.timeLabel === timeLabel
    );
    if (taken) {
      return { ok: false, error: "El terapeuta ya tiene otra cita en ese horario. Elige otra fecha u hora." };
    }

    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, therapistId, date, timeLabel } : a
      ),
    }));
    return { ok: true };
  },

  createTherapist: (data) => {
    const error = validateTherapistInput(data, get().therapistAccounts, null);
    if (error) return { ok: false, error };

    const specialist: Specialist = {
      id: nextId("sp"),
      name: data.name.trim(),
      title: data.title.trim(),
      registry: data.registry.trim(),
      experienceYears: data.experienceYears,
      price: data.price,
      // Campos que el admin no edita (ver SPEC 01): sin foto ni reseñas hasta que existan esos flujos.
      avatar: "",
      rating: 0,
      reviewsCount: 0,
      about: "",
      sessionDuration: "50 minutos",
      currency: "USD",
      currencySymbol: "$",
      languages: ["Español"],
      active: true,
    };
    const account: TherapistAccount = {
      specialistId: specialist.id,
      identification: data.identification.trim(),
      password: data.password,
    };

    set((state) => ({
      specialists: [...state.specialists, specialist],
      therapistAccounts: [...state.therapistAccounts, account],
    }));
    return { ok: true };
  },

  updateTherapist: (id, data) => {
    if (!get().specialists.some((sp) => sp.id === id)) {
      return { ok: false, error: "El terapeuta no existe." };
    }
    const error = validateTherapistInput(data, get().therapistAccounts, id);
    if (error) return { ok: false, error };

    set((state) => ({
      specialists: state.specialists.map((sp) =>
        sp.id === id
          ? {
              ...sp,
              name: data.name.trim(),
              title: data.title.trim(),
              registry: data.registry.trim(),
              experienceYears: data.experienceYears,
              price: data.price,
            }
          : sp
      ),
      therapistAccounts: state.therapistAccounts.map((a) =>
        a.specialistId === id
          ? {
              ...a,
              identification: data.identification.trim(),
              // Contraseña vacía al editar = mantener la actual.
              password: data.password || a.password,
            }
          : a
      ),
    }));
    return { ok: true };
  },

  setTherapistActive: (id, active) => {
    set((state) => ({
      specialists: state.specialists.map((sp) => (sp.id === id ? { ...sp, active } : sp)),
    }));
  },
}));

/**
 * Reglas del formulario de terapeutas (SPEC 01). `editingId` es el specialistId que se edita,
 * o null al crear (la contraseña solo es obligatoria al crear).
 */
function validateTherapistInput(
  data: TherapistInput,
  accounts: TherapistAccount[],
  editingId: string | null
): string | null {
  if (!data.name.trim() || !data.title.trim() || !data.registry.trim() || !data.identification.trim()) {
    return "Completa todos los campos obligatorios.";
  }
  if (!editingId && !data.password) {
    return "La contraseña es obligatoria.";
  }
  if (!Number.isFinite(data.price) || data.price <= 0 || Math.round(data.price * 100) / 100 !== data.price) {
    return "El valor de consulta debe ser mayor a 0 y tener como máximo 2 decimales.";
  }
  if (!Number.isInteger(data.experienceYears) || data.experienceYears < 0) {
    return "Los años de experiencia deben ser un número entero igual o mayor a 0.";
  }
  const identification = data.identification.trim();
  if (!/^\d{10}$/.test(identification)) {
    return "La cédula debe tener exactamente 10 dígitos.";
  }
  if (accounts.some((a) => a.identification === identification && a.specialistId !== editingId)) {
    return "Ya existe un terapeuta con esa cédula.";
  }
  return null;
}
