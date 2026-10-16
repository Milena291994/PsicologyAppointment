import { Appointment, Specialist, TimeSlot } from "@/types";
import { parseDateKey } from "@/lib/date";

/** "HH:mm" → minutos desde medianoche (las horas se comparan siempre en minutos, nunca como texto). */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Minutos desde medianoche → "HH:mm". */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "13:00" → "01:00 PM" (formato de `Appointment.timeLabel`). */
export function formatSlotLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "01:00 PM" → minutos desde medianoche; útil para ordenar citas por hora. */
export function labelToMinutes(label: string): number {
  const [time, meridiem] = label.split(" ");
  const [h, m] = time.split(":").map(Number);
  const hour24 = (h % 12) + (meridiem === "PM" ? 12 : 0);
  return hour24 * 60 + m;
}

/**
 * Horarios del día: del rango del día de la semana, cada `slotIntervalMinutes`, solo si la cita
 * termina dentro del rango; se excluyen los que se solapan con bloqueos de esa fecha.
 * [] si el día está cancelado o el terapeuta no atiende ese día.
 */
export function generateDaySlots(specialist: Specialist, dateKey: string): TimeSlot[] {
  if (specialist.cancelledDates.includes(dateKey)) return [];

  const range = specialist.weeklySchedule[parseDateKey(dateKey).getDay()];
  const interval = specialist.slotIntervalMinutes;
  if (!range || interval <= 0) return [];

  const blocks = specialist.timeBlocks
    .filter((b) => b.date === dateKey)
    .map((b) => ({ start: timeToMinutes(b.start), end: timeToMinutes(b.end) }));

  const slots: TimeSlot[] = [];
  const end = timeToMinutes(range.end);
  for (let start = timeToMinutes(range.start); start + interval <= end; start += interval) {
    // La cita ocupa [start, start + interval); se descarta si toca algún bloqueo.
    const overlapsBlock = blocks.some((b) => start < b.end && start + interval > b.start);
    if (overlapsBlock) continue;

    const time = minutesToTime(start);
    slots.push({ time, period: start < 12 * 60 ? "morning" : "afternoon", label: formatSlotLabel(time) });
  }
  return slots;
}

/** Labels que el terapeuta ofrece ese día, en orden; [] si el día está cancelado o sin atención. */
export function offeredSlotLabels(specialist: Specialist, dateKey: string): string[] {
  return generateDaySlots(specialist, dateKey).map((s) => s.label);
}

/** Labels ocupados por citas ACTIVAS del terapeuta en esa fecha (las canceladas liberan el horario). */
export function takenSlotLabels(
  appointments: Appointment[],
  therapistId: string,
  dateKey: string,
  excludeAppointmentId?: string
): Set<string> {
  return new Set(
    appointments
      .filter(
        (a) =>
          a.status === "active" &&
          a.therapistId === therapistId &&
          a.date === dateKey &&
          a.id !== excludeAppointmentId
      )
      .map((a) => a.timeLabel)
  );
}

/** true si queda al menos un horario ofrecido y libre ese día. */
export function hasAvailability(specialist: Specialist, appointments: Appointment[], dateKey: string): boolean {
  const taken = takenSlotLabels(appointments, specialist.id, dateKey);
  return offeredSlotLabels(specialist, dateKey).some((label) => !taken.has(label));
}
