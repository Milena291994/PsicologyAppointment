import React, { useState } from "react";
import { Clock, Save, CalendarX2, CalendarCheck, Ban, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { usePatientStore } from "@/store/usePatientStore";
import { TimeBlock, WeeklySchedule } from "@/types";
import { formatShortDate, todayKey } from "@/lib/date";
import { formatSlotLabel } from "@/lib/schedule";
import { toast } from "sonner";

/** Filas en orden lunes → domingo (0 = domingo en `WeeklySchedule`). */
const WEEKDAYS = [
  { day: 1, label: "Lunes" },
  { day: 2, label: "Martes" },
  { day: 3, label: "Miércoles" },
  { day: 4, label: "Jueves" },
  { day: 5, label: "Viernes" },
  { day: 6, label: "Sábado" },
  { day: 0, label: "Domingo" },
];

/** Rango sugerido al marcar "Atiende" en un día que no tenía horario. */
const DEFAULT_RANGE = { start: "08:00", end: "18:00" };

const dateFieldClass =
  "flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const timeFieldClass =
  "flex h-9 w-full rounded-lg border border-input bg-card px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

/** Fila editable: se conservan las horas aunque se desmarque "Atiende", para no perderlas al volver a marcar. */
interface DayDraft {
  enabled: boolean;
  start: string;
  end: string;
}

function toDraft(schedule: WeeklySchedule): Record<number, DayDraft> {
  const draft: Record<number, DayDraft> = {};
  for (let day = 0; day <= 6; day++) {
    const range = schedule[day] ?? null;
    draft[day] = range ? { enabled: true, ...range } : { enabled: false, ...DEFAULT_RANGE };
  }
  return draft;
}

function toSchedule(draft: Record<number, DayDraft>): WeeklySchedule {
  const schedule: WeeklySchedule = {};
  for (let day = 0; day <= 6; day++) {
    const { enabled, start, end } = draft[day];
    schedule[day] = enabled ? { start, end } : null;
  }
  return schedule;
}

/** "Mis horarios" (rol therapist): rango por día + intervalo de cita, bloqueos por fecha y cancelación de días. */
export const TherapistSchedulePage: React.FC = () => {
  const currentTherapist = usePatientStore((s) => s.currentTherapist);
  const updateWeeklySchedule = usePatientStore((s) => s.updateWeeklySchedule);
  const appointments = usePatientStore((s) => s.appointments);
  const cancelDay = usePatientStore((s) => s.cancelDay);
  const reopenDay = usePatientStore((s) => s.reopenDay);
  const addTimeBlock = usePatientStore((s) => s.addTimeBlock);
  const removeTimeBlock = usePatientStore((s) => s.removeTimeBlock);

  const today = todayKey();
  const [dayToCancel, setDayToCancel] = useState(today);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [blockDate, setBlockDate] = useState(today);
  const [blockStart, setBlockStart] = useState("13:00");
  const [blockEnd, setBlockEnd] = useState("14:00");

  // Borrador local: los cambios solo se aplican (y validan) al pulsar "Guardar".
  const [draft, setDraft] = useState<Record<number, DayDraft>>(() => toDraft(currentTherapist?.weeklySchedule ?? {}));
  const [intervalInput, setIntervalInput] = useState(() => String(currentTherapist?.slotIntervalMinutes ?? 60));

  if (!currentTherapist) return null;

  const updateDay = (day: number, patch: Partial<DayDraft>) =>
    setDraft((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));

  const upcomingCancelledDates = currentTherapist.cancelledDates.filter((d) => d >= today);
  // `timeBlocks` ya viene ordenado por fecha y hora desde el store.
  const upcomingBlocks = currentTherapist.timeBlocks.filter((b) => b.date >= today);

  const handleAddBlock = () => {
    const block = { date: blockDate, start: blockStart, end: blockEnd };
    const result = addTimeBlock(block);
    if (!result.ok) {
      toast.error("No se pudo bloquear el horario", { description: result.error });
      return;
    }
    toast.success("Horario bloqueado", {
      description: `${formatShortDate(blockDate)} · ${formatSlotLabel(blockStart)} – ${formatSlotLabel(blockEnd)}`,
    });
  };

  const handleRemoveBlock = (block: TimeBlock) => {
    const result = removeTimeBlock(block);
    if (!result.ok) {
      toast.error("No se pudo quitar el bloqueo", { description: result.error });
      return;
    }
    toast.success("Bloqueo quitado", {
      description: `${formatShortDate(block.date)} · ${formatSlotLabel(block.start)} – ${formatSlotLabel(block.end)} vuelve a estar disponible.`,
    });
  };
  const appointmentsOnDay = appointments.filter(
    (a) => a.therapistId === currentTherapist.id && a.date === dayToCancel && a.status === "active"
  ).length;

  const openCancelDay = () => {
    if (!dayToCancel || dayToCancel < today) {
      toast.error("Fecha no válida", { description: "Solo puedes cancelar el día de hoy o fechas futuras." });
      return;
    }
    if (currentTherapist.cancelledDates.includes(dayToCancel)) {
      toast.info("Día ya cancelado", { description: `${formatShortDate(dayToCancel)} ya está cancelado.` });
      return;
    }
    setConfirmingCancel(true);
  };

  const confirmCancelDay = () => {
    const result = cancelDay(dayToCancel);
    if (!result.ok) {
      toast.error("No se pudo cancelar el día", { description: result.error });
      return;
    }
    const count = result.cancelledCount ?? 0;
    toast.success("Día cancelado", {
      description: `${formatShortDate(dayToCancel)} · ${count} ${count === 1 ? "cita cancelada" : "citas canceladas"}.`,
    });
    setConfirmingCancel(false);
  };

  const handleReopen = (dateKey: string) => {
    const result = reopenDay(dateKey);
    if (!result.ok) {
      toast.error("No se pudo reabrir el día", { description: result.error });
      return;
    }
    toast.success("Día reabierto", {
      description: `${formatShortDate(dateKey)} vuelve a aceptar reservas. Las citas canceladas siguen canceladas.`,
    });
  };

  const handleSave = () => {
    // Un campo vacío pasa como NaN para que la validación del store lo rechace.
    const minutes = intervalInput.trim() === "" ? NaN : Number(intervalInput);
    const result = updateWeeklySchedule(toSchedule(draft), minutes);
    if (!result.ok) {
      toast.error("No se pudo guardar el horario", { description: result.error });
      return;
    }
    toast.success("Horario actualizado", { description: "Los pacientes ya ven tus nuevos horarios al reservar." });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">Mis horarios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Indica los días que atiendes, el rango de horas y la duración de cada cita. Los horarios se generan solos.
        </p>
      </div>

      <Card className="overflow-hidden mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-4 sm:p-5 border-b border-border">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>Horario semanal</span>
            </div>
            <div className="w-48">
              <Label htmlFor="slot-interval">Intervalo de cita (min)</Label>
              <Input
                id="slot-interval"
                type="number"
                min={15}
                max={180}
                step={5}
                value={intervalInput}
                onChange={(e) => setIntervalInput(e.target.value)}
              />
            </div>
          </div>
          <Button size="sm" onClick={handleSave} className="gap-1.5 shrink-0">
            <Save className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Día</TableHead>
              <TableHead className="text-center">Atiende</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead>Hasta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {WEEKDAYS.map(({ day, label }) => {
              const row = draft[day];
              return (
                <TableRow key={day}>
                  <TableCell className="font-semibold text-foreground">{label}</TableCell>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      aria-label={`Atiende el ${label}`}
                      checked={row.enabled}
                      onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                      className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    <input
                      type="time"
                      step={300}
                      aria-label={`${label} desde`}
                      value={row.start}
                      disabled={!row.enabled}
                      onChange={(e) => updateDay(day, { start: e.target.value })}
                      className={timeFieldClass}
                    />
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    <input
                      type="time"
                      step={300}
                      aria-label={`${label} hasta`}
                      value={row.end}
                      disabled={!row.enabled}
                      onChange={(e) => updateDay(day, { end: e.target.value })}
                      className={timeFieldClass}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4 sm:p-5 space-y-5 mb-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Ban className="w-4 h-4 text-primary" />
          <span>Bloqueos de horario</span>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Bloquea un tramo de una fecha concreta (por ejemplo, de 13:00 a 14:00). Esos horarios no se ofrecen al reservar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-end">
          <div>
            <Label htmlFor="block-date">Fecha</Label>
            <input
              id="block-date"
              type="date"
              min={today}
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className={dateFieldClass}
            />
          </div>
          <div>
            <Label htmlFor="block-start">Desde</Label>
            <input
              id="block-start"
              type="time"
              step={300}
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
              className={dateFieldClass}
            />
          </div>
          <div>
            <Label htmlFor="block-end">Hasta</Label>
            <input
              id="block-end"
              type="time"
              step={300}
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
              className={dateFieldClass}
            />
          </div>
          <Button variant="outline" onClick={handleAddBlock} className="gap-1.5 h-10">
            <Plus className="w-4 h-4" />
            <span>Agregar bloqueo</span>
          </Button>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-foreground mb-2">Bloqueos próximos</h3>
          {upcomingBlocks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tienes bloqueos de horario próximos.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingBlocks.map((block) => (
                <li
                  key={`${block.date}-${block.start}-${block.end}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <span className="text-sm text-foreground">
                    <span className="capitalize">{formatShortDate(block.date)}</span> ·{" "}
                    <span className="tabular-nums">
                      {formatSlotLabel(block.start)} – {formatSlotLabel(block.end)}
                    </span>
                  </span>
                  <Button variant="outline" size="sm" onClick={() => handleRemoveBlock(block)} className="gap-1.5">
                    <X className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-5 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarX2 className="w-4 h-4 text-primary" />
          <span>Cancelar un día</span>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Se cancelan todas tus citas activas de ese día y el día deja de aceptar reservas.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="sm:w-64">
            <Label htmlFor="cancel-day">Fecha</Label>
            <input
              id="cancel-day"
              type="date"
              min={today}
              value={dayToCancel}
              onChange={(e) => setDayToCancel(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button variant="destructive" onClick={openCancelDay} className="gap-1.5">
            <CalendarX2 className="w-4 h-4" />
            <span>Cancelar día</span>
          </Button>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-foreground mb-2">Días cancelados</h3>
          {upcomingCancelledDates.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tienes días cancelados próximos.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingCancelledDates.map((dateKey) => (
                <li
                  key={dateKey}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <span className="text-sm text-foreground capitalize">{formatShortDate(dateKey)}</span>
                  <Button variant="outline" size="sm" onClick={() => handleReopen(dateKey)} className="gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Reabrir</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Dialog open={confirmingCancel} onOpenChange={setConfirmingCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar {dayToCancel && formatShortDate(dayToCancel)}</DialogTitle>
            <DialogDescription>
              Se cancelarán {appointmentsOnDay} {appointmentsOnDay === 1 ? "cita" : "citas"}. Los pacientes las verán
              como canceladas y podrás reprogramarlas desde "Mi agenda".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingCancel(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={confirmCancelDay}>
              Cancelar día
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
