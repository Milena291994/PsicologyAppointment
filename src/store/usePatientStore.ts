import { create } from "zustand";
import {
  AdminAccount,
  Patient,
  PatientProfile,
  Dependent,
  Specialist,
  TherapistAccount,
  WeeklySchedule,
  TimeBlock,
  UserRole,
} from "@/types";
import { APP_CONFIG } from "@/data/mockData";
import { isMinor } from "@/lib/age";
import { todayKey } from "@/lib/date";
import { nextId } from "@/lib/id";
import { labelToMinutes, offeredSlotLabels, timeToMinutes } from "@/lib/schedule";
import { AppointmentActor, cancelTherapistDay, listAppointments } from "@/services/appointmentsService";

const OWN_APPOINTMENTS_ONLY = "Solo puedes gestionar tus propias citas.";
const ADMIN_ONLY = "Solo un administrador puede gestionar terapeutas.";
const INACTIVE_THERAPIST = "Tu cuenta de terapeuta está desactivada.";
const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** "HH:mm" en 24 h, como lo producen los inputs type="time". */
function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

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

interface PatientStoreState {
  patients: Patient[];
  currentPatient: (Patient & { dependents: Dependent[] }) | null;
  /** Terapeuta en sesión (rol "therapist"); excluyente con `currentPatient`. */
  currentTherapist: Specialist | null;
  /** Administrador en sesión (rol "admin"); excluyente con `currentPatient` y `currentTherapist`. */
  currentAdmin: AdminAccount | null;
  role: UserRole | null;
  isAuthenticated: boolean;
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
  /** Acciones del rol admin: rechazan cualquier otro rol. */
  createTherapist: (data: TherapistInput) => { ok: boolean; error?: string };
  updateTherapist: (id: string, data: TherapistInput) => { ok: boolean; error?: string };
  /** No desactiva a un terapeuta con citas activas de hoy en adelante: hay que reprogramarlas o cancelarlas antes. */
  setTherapistActive: (id: string, active: boolean) => Promise<{ ok: boolean; error?: string }>;
  /**
   * Acciones del rol therapist: operan siempre sobre `currentTherapist`, solo si sigue activo, y solo sobre
   * sus propias citas. Las que dependen de las citas consultan el servicio y por eso son asíncronas.
   */
  updateWeeklySchedule: (
    schedule: WeeklySchedule,
    slotIntervalMinutes: number
  ) => Promise<{ ok: boolean; error?: string }>;
  addTimeBlock: (block: TimeBlock) => Promise<{ ok: boolean; error?: string }>;
  removeTimeBlock: (block: TimeBlock) => { ok: boolean; error?: string };
  cancelDay: (dateKey: string) => Promise<{ ok: boolean; error?: string; cancelledCount?: number }>;
  reopenDay: (dateKey: string) => { ok: boolean; error?: string };
}

export const usePatientStore = create<PatientStoreState>((set, get) => ({
  patients: [...APP_CONFIG.registeredPatients],
  currentPatient: null,
  currentTherapist: null,
  currentAdmin: null,
  role: null,
  isAuthenticated: false,
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

  createTherapist: (data) => {
    if (get().role !== "admin") return { ok: false, error: ADMIN_ONLY };
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
      // Sin horario hasta que el propio terapeuta lo configure en "Mis horarios" (SPEC 02).
      weeklySchedule: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
      slotIntervalMinutes: 60,
      cancelledDates: [],
      timeBlocks: [],
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
    if (get().role !== "admin") return { ok: false, error: ADMIN_ONLY };
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

  setTherapistActive: async (id, active) => {
    if (get().role !== "admin") return { ok: false, error: ADMIN_ONLY };
    if (!get().specialists.some((sp) => sp.id === id)) {
      return { ok: false, error: "El terapeuta no existe." };
    }

    if (!active) {
      const today = todayKey();
      const pending = (await listAppointments({ therapistId: id })).filter(
        (a) => a.status === "active" && a.date >= today
      ).length;
      if (pending > 0) {
        return {
          ok: false,
          error: `Tiene ${pending} ${pending === 1 ? "cita agendada" : "citas agendadas"} de hoy en adelante. Deben reprogramarse o cancelarse antes de desactivarlo.`,
        };
      }
    }

    set((state) => ({
      specialists: state.specialists.map((sp) => (sp.id === id ? { ...sp, active } : sp)),
    }));
    return { ok: true };
  },

  updateWeeklySchedule: async (schedule, slotIntervalMinutes) => {
    const session = requireActiveTherapist(get());
    if ("error" in session) return { ok: false, error: session.error };
    const { therapist } = session;

    if (!Number.isInteger(slotIntervalMinutes) || slotIntervalMinutes % 5 !== 0 || slotIntervalMinutes < 15 || slotIntervalMinutes > 180) {
      return { ok: false, error: "El intervalo de cita debe ser un múltiplo de 5 entre 15 y 180 minutos." };
    }

    const next: WeeklySchedule = {};
    for (let day = 0; day <= 6; day++) {
      const range = schedule[day] ?? null;
      if (range) {
        if (!isValidTime(range.start) || !isValidTime(range.end) || timeToMinutes(range.start) >= timeToMinutes(range.end)) {
          return { ok: false, error: `${WEEKDAY_NAMES[day]}: la hora desde debe ser anterior a la hora hasta.` };
        }
        if (timeToMinutes(range.end) - timeToMinutes(range.start) < slotIntervalMinutes) {
          return { ok: false, error: `${WEEKDAY_NAMES[day]}: el rango no alcanza para una cita de ${slotIntervalMinutes} minutos.` };
        }
      }
      next[day] = range ? { start: range.start, end: range.end } : null;
    }

    // Ninguna cita activa futura puede quedar fuera de los horarios que generaría el nuevo horario.
    const draft = { ...therapist, weeklySchedule: next, slotIntervalMinutes };
    const today = todayKey();
    const outside = (await listAppointments({ therapistId: therapist.id })).filter(
      (a) =>
        a.status === "active" &&
        a.date >= today &&
        !offeredSlotLabels(draft, a.date).includes(a.timeLabel)
    ).length;
    if (outside > 0) {
      return {
        ok: false,
        error: `Hay ${outside} ${outside === 1 ? "cita agendada que quedaría" : "citas agendadas que quedarían"} fuera del nuevo horario. Reprográmalas o cancélalas primero.`,
      };
    }

    set((state) => updateCurrentSpecialist(state, (sp) => ({ ...sp, weeklySchedule: next, slotIntervalMinutes })));
    return { ok: true };
  },

  addTimeBlock: async (block) => {
    const session = requireActiveTherapist(get());
    if ("error" in session) return { ok: false, error: session.error };
    const { therapist } = session;

    if (!block.date || block.date < todayKey()) {
      return { ok: false, error: "Solo puedes bloquear horarios de hoy o fechas futuras." };
    }
    if (!isValidTime(block.start) || !isValidTime(block.end) || timeToMinutes(block.start) >= timeToMinutes(block.end)) {
      return { ok: false, error: "La hora desde debe ser anterior a la hora hasta." };
    }

    const start = timeToMinutes(block.start);
    const end = timeToMinutes(block.end);
    const overlapsBlock = therapist.timeBlocks.some(
      (b) => b.date === block.date && start < timeToMinutes(b.end) && end > timeToMinutes(b.start)
    );
    if (overlapsBlock) {
      return { ok: false, error: "Ya tienes un bloqueo que se cruza con ese tramo en esa fecha." };
    }

    // Una cita ocupa [inicio, inicio + intervalo); no se puede bloquear encima de una cita activa.
    const interval = therapist.slotIntervalMinutes;
    const conflicts = (await listAppointments({ therapistId: therapist.id })).filter((a) => {
      if (a.status !== "active" || a.date !== block.date) return false;
      const apptStart = labelToMinutes(a.timeLabel);
      return apptStart < end && apptStart + interval > start;
    }).length;
    if (conflicts > 0) {
      return {
        ok: false,
        error: `Hay ${conflicts} ${conflicts === 1 ? "cita agendada" : "citas agendadas"} en ese tramo. Reprográmalas o cancélalas primero.`,
      };
    }

    set((state) =>
      updateCurrentSpecialist(state, (sp) => ({
        ...sp,
        timeBlocks: [...sp.timeBlocks, { date: block.date, start: block.start, end: block.end }].sort(
          (a, b) => a.date.localeCompare(b.date) || timeToMinutes(a.start) - timeToMinutes(b.start)
        ),
      }))
    );
    return { ok: true };
  },

  removeTimeBlock: (block) => {
    const session = requireActiveTherapist(get());
    if ("error" in session) return { ok: false, error: session.error };

    set((state) =>
      updateCurrentSpecialist(state, (sp) => ({
        ...sp,
        timeBlocks: sp.timeBlocks.filter(
          (b) => !(b.date === block.date && b.start === block.start && b.end === block.end)
        ),
      }))
    );
    return { ok: true };
  },

  cancelDay: async (dateKey) => {
    const session = requireActiveTherapist(get());
    if ("error" in session) return { ok: false, error: session.error };
    if (dateKey < todayKey()) {
      return { ok: false, error: "Solo puedes cancelar el día de hoy o fechas futuras." };
    }
    if (session.therapist.cancelledDates.includes(dateKey)) {
      return { ok: true, cancelledCount: 0 };
    }

    // Primero se cancelan las citas en el servicio; el día solo se marca si eso funcionó.
    const result = await cancelTherapistDay(dateKey, getAppointmentActor());
    if (!result.ok) return result;

    set((state) =>
      updateCurrentSpecialist(state, (sp) => ({
        ...sp,
        cancelledDates: sp.cancelledDates.includes(dateKey) ? sp.cancelledDates : [...sp.cancelledDates, dateKey].sort(),
      }))
    );
    return { ok: true, cancelledCount: result.cancelledCount };
  },

  reopenDay: (dateKey) => {
    const session = requireActiveTherapist(get());
    if ("error" in session) return { ok: false, error: session.error };

    // Las citas canceladas ese día siguen canceladas; se reprograman una a una desde "Mi agenda".
    set((state) =>
      updateCurrentSpecialist(state, (sp) => ({
        ...sp,
        cancelledDates: sp.cancelledDates.filter((d) => d !== dateKey),
      }))
    );
    return { ok: true };
  },
}));

/**
 * Terapeuta en sesión leído de `specialists` (no de la copia `currentTherapist`), para que una
 * desactivación del admin le corte las acciones aunque su sesión siga abierta.
 */
function requireActiveTherapist(state: PatientStoreState): { therapist: Specialist } | { error: string } {
  const id = state.role === "therapist" ? state.currentTherapist?.id : undefined;
  const therapist = id ? state.specialists.find((sp) => sp.id === id) : undefined;
  if (!therapist) return { error: OWN_APPOINTMENTS_ONLY };
  if (!therapist.active) return { error: INACTIVE_THERAPIST };
  return { therapist };
}

/**
 * Quién opera sobre citas según la sesión actual; lo usa `appointmentsService` (en el mock) para validar
 * permisos. null si no hay sesión o el terapeuta fue desactivado. Con la API real lo resolverá el backend.
 */
export function getAppointmentActor(): AppointmentActor | null {
  const state = usePatientStore.getState();
  if (state.role === "patient" && state.currentPatient) {
    return {
      role: "patient",
      patientId: state.currentPatient.id,
      attendeeIds: [state.currentPatient.id, ...state.currentPatient.dependents.map((d) => d.id)],
    };
  }
  if (state.role === "therapist") {
    const session = requireActiveTherapist(state);
    return "error" in session ? null : { role: "therapist", therapistId: session.therapist.id };
  }
  if (state.role === "admin" && state.currentAdmin) return { role: "admin" };
  return null;
}

/**
 * Aplica `update` al terapeuta en sesión manteniendo sincronizadas su ficha en `specialists`
 * y la copia `currentTherapist` (si no, la UI del terapeuta vería datos viejos).
 */
function updateCurrentSpecialist(
  state: PatientStoreState,
  update: (sp: Specialist) => Specialist
): Pick<PatientStoreState, "specialists" | "currentTherapist"> {
  const id = state.currentTherapist?.id;
  const specialists = state.specialists.map((sp) => (sp.id === id ? update(sp) : sp));
  return {
    specialists,
    currentTherapist: specialists.find((sp) => sp.id === id) ?? state.currentTherapist,
  };
}

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
