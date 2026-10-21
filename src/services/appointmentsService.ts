import { Appointment, BusySlot, Modality, Specialist } from "@/types";
import { SEED_APPOINTMENTS } from "@/data/mockData";
import { todayKey } from "@/lib/date";
import { nextId } from "@/lib/id";
import { offeredSlotLabels, takenSlotLabels } from "@/lib/schedule";

/**
 * Servicio de citas. Hoy es un mock en memoria sembrado con `SEED_APPOINTMENTS`; la interfaz es
 * asíncrona y valida todo aquí (no en la UI) para que cambiar a una API real solo toque este archivo.
 * Las citas NO viven en el store: las páginas las leen con `useAppointments` / `useBusySlots`.
 */

export type ServiceResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Quién ejecuta la acción. Con una API real lo resolverá el backend desde la sesión;
 * en el mock lo arma `getAppointmentActor()` del store.
 */
export type AppointmentActor =
  | { role: "patient"; patientId: string; attendeeIds: string[] }
  | { role: "therapist"; therapistId: string }
  | { role: "admin" };

export interface AppointmentFilter {
  therapistId?: string;
  attendeeIds?: string[];
}

export interface CreateAppointmentInput {
  attendeeType: "patient" | "dependent";
  attendeeId: string;
  attendeeName: string;
  attendeeIdentification: string;
  date: string;
  timeLabel: string;
  modality: Modality;
  bookingCode: string;
}

const OWN_APPOINTMENTS_ONLY = "Solo puedes gestionar tus propias citas.";
/** Latencia simulada para que la UI ya maneje estados de carga como con la API. */
const MOCK_LATENCY_MS = 150;

let appointments: Appointment[] = [...SEED_APPOINTMENTS];
const listeners = new Set<() => void>();

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

function commit(next: Appointment[]): void {
  appointments = next;
  listeners.forEach((listener) => listener());
}

/** Avisa cada vez que cambian las citas; devuelve la función para desuscribirse. */
export function subscribeAppointments(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Citas completas (con datos del paciente); solo para el propio paciente o el terapeuta dueño. */
export async function listAppointments(filter: AppointmentFilter): Promise<Appointment[]> {
  await delay();
  const attendeeIds = filter.attendeeIds && new Set(filter.attendeeIds);
  return appointments
    .filter((a) => !filter.therapistId || a.therapistId === filter.therapistId)
    .filter((a) => !attendeeIds || attendeeIds.has(a.attendeeId))
    .map((a) => ({ ...a }));
}

/** Horarios ocupados (citas activas) de un terapeuta, sin datos de los pacientes. */
export async function listBusySlots(therapistId: string): Promise<BusySlot[]> {
  await delay();
  return appointments
    .filter((a) => a.therapistId === therapistId && a.status === "active")
    .map(({ id, therapistId, date, timeLabel, status }) => ({ id, therapistId, date, timeLabel, status }));
}

/** Motivo por el que ese horario no se puede reservar, o null si está libre y se ofrece. */
function slotError(therapist: Specialist, date: string, timeLabel: string, excludeId?: string): string | null {
  if (!therapist.active) return "El terapeuta no está disponible para nuevas citas.";
  if (date < todayKey()) return "No puedes agendar una cita en una fecha pasada.";
  if (therapist.cancelledDates.includes(date)) return "El terapeuta canceló la atención ese día. Elige otra fecha.";
  if (!offeredSlotLabels(therapist, date).includes(timeLabel)) {
    return "El terapeuta no atiende en ese horario. Elige otra fecha u hora.";
  }
  if (takenSlotLabels(appointments, therapist.id, date, excludeId).has(timeLabel)) {
    return "El terapeuta ya tiene otra cita en ese horario. Elige otra fecha u hora.";
  }
  return null;
}

/**
 * Registra la cita tras el pago. El monto se toma de la tarifa vigente del terapeuta, no del cliente.
 * `therapist` lo pasa el mock; la API lo buscará por id.
 */
export async function createAppointment(
  input: CreateAppointmentInput,
  therapist: Specialist,
  actor: AppointmentActor | null
): Promise<ServiceResult<{ appointment: Appointment }>> {
  await delay();
  if (actor?.role !== "patient" || !actor.attendeeIds.includes(input.attendeeId)) {
    return { ok: false, error: "Solo puedes agendar citas para ti o tus dependientes." };
  }
  const error = slotError(therapist, input.date, input.timeLabel);
  if (error) return { ok: false, error };

  const appointment: Appointment = {
    ...input,
    id: nextId("apt"),
    therapistId: therapist.id,
    amountPaid: therapist.price,
    createdAt: new Date().toISOString(),
    status: "active",
  };
  commit([...appointments, appointment]);
  return { ok: true, appointment: { ...appointment } };
}

/** Mueve la cita a otro día/horario (y, solo para el paciente, a otro terapeuta). Reactiva una cancelada. */
export async function rescheduleAppointment(
  id: string,
  target: Specialist,
  date: string,
  timeLabel: string,
  actor: AppointmentActor | null
): Promise<ServiceResult> {
  await delay();
  const appointment = appointments.find((a) => a.id === id);
  if (!appointment) return { ok: false, error: "La cita no existe." };

  if (actor?.role === "therapist") {
    // El terapeuta solo gestiona sus propias citas y no puede pasarlas a otro terapeuta.
    if (appointment.therapistId !== actor.therapistId || target.id !== actor.therapistId) {
      return { ok: false, error: OWN_APPOINTMENTS_ONLY };
    }
  } else if (actor?.role === "patient") {
    if (!actor.attendeeIds.includes(appointment.attendeeId)) return { ok: false, error: OWN_APPOINTMENTS_ONLY };
    if (appointment.status === "cancelled") {
      return { ok: false, error: "Esta cita fue cancelada por el terapeuta y solo él puede reprogramarla." };
    }
  } else {
    return { ok: false, error: OWN_APPOINTMENTS_ONLY };
  }

  const error = slotError(target, date, timeLabel, id);
  if (error) return { ok: false, error };

  commit(
    appointments.map((a) =>
      a.id === id
        ? { ...a, therapistId: target.id, date, timeLabel, status: "active" as const, cancelledAt: undefined }
        : a
    )
  );
  return { ok: true };
}

/** Cancela una cita activa de hoy en adelante; solo el terapeuta dueño. */
export async function cancelAppointment(id: string, actor: AppointmentActor | null): Promise<ServiceResult> {
  await delay();
  const appointment = appointments.find((a) => a.id === id);
  if (actor?.role !== "therapist" || !appointment || appointment.therapistId !== actor.therapistId) {
    return { ok: false, error: OWN_APPOINTMENTS_ONLY };
  }
  if (appointment.status !== "active") return { ok: false, error: "La cita ya está cancelada." };
  if (appointment.date < todayKey()) return { ok: false, error: "No puedes cancelar una cita pasada." };

  const cancelledAt = new Date().toISOString();
  commit(appointments.map((a) => (a.id === id ? { ...a, status: "cancelled" as const, cancelledAt } : a)));
  return { ok: true };
}

/** Cancela todas las citas activas del terapeuta en esa fecha (al cancelar el día completo). */
export async function cancelTherapistDay(
  dateKey: string,
  actor: AppointmentActor | null
): Promise<ServiceResult<{ cancelledCount: number }>> {
  await delay();
  if (actor?.role !== "therapist") return { ok: false, error: OWN_APPOINTMENTS_ONLY };
  if (dateKey < todayKey()) return { ok: false, error: "Solo puedes cancelar el día de hoy o fechas futuras." };

  const isAffected = (a: Appointment) =>
    a.therapistId === actor.therapistId && a.date === dateKey && a.status === "active";
  const cancelledCount = appointments.filter(isAffected).length;
  const cancelledAt = new Date().toISOString();
  commit(appointments.map((a) => (isAffected(a) ? { ...a, status: "cancelled" as const, cancelledAt } : a)));
  return { ok: true, cancelledCount };
}
