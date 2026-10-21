import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Video, MapPin, RefreshCw, CalendarPlus, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getAppointmentActor, usePatientStore } from "@/store/usePatientStore";
import { useAppointments, useBusySlots } from "@/hooks/useAppointments";
import { rescheduleAppointment } from "@/services/appointmentsService";
import { ROUTES } from "@/routes/paths";
import { todayKey } from "@/lib/date";
import { offeredSlotLabels, takenSlotLabels } from "@/lib/schedule";
import { Appointment } from "@/types";
import { toast } from "sonner";

export const AppointmentsPage: React.FC = () => {
  const currentPatient = usePatientStore((s) => s.currentPatient);
  const specialists = usePatientStore((s) => s.specialists);
  const activeSpecialists = specialists.filter((sp) => sp.active);

  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [newTherapistId, setNewTherapistId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTimeLabel, setNewTimeLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const attendeeIds = currentPatient ? [currentPatient.id, ...currentPatient.dependents.map((d) => d.id)] : null;
  const { appointments: myAppointments, loading } = useAppointments(attendeeIds && { attendeeIds });
  // Solo los horarios ocupados del terapeuta destino, sin datos de otros pacientes.
  const { busySlots } = useBusySlots(rescheduling ? newTherapistId || null : null);

  if (!currentPatient) return null;

  // Busca entre todos (incluidos inactivos) para seguir mostrando el nombre en citas antiguas.
  const findTherapist = (id: string | null) => specialists.find((sp) => sp.id === id) || null;

  const openReschedule = (appt: Appointment) => {
    setRescheduling(appt);
    const currentIsActive = activeSpecialists.some((sp) => sp.id === appt.therapistId);
    setNewTherapistId(currentIsActive && appt.therapistId ? appt.therapistId : activeSpecialists[0]?.id ?? "");
    setNewDate(appt.date < todayKey() ? todayKey() : appt.date);
    setNewTimeLabel(appt.timeLabel);
  };

  const confirmReschedule = async () => {
    const target = findTherapist(newTherapistId);
    if (!rescheduling || !target || !newDate || !newTimeLabel) return;
    setIsSaving(true);
    const result = await rescheduleAppointment(rescheduling.id, target, newDate, newTimeLabel, getAppointmentActor());
    setIsSaving(false);
    if (!result.ok) {
      toast.error("Horario no disponible", { description: result.error });
      return;
    }
    toast.success("Cita reagendada", {
      description: `${findTherapist(newTherapistId)?.name} · ${newDate} · ${newTimeLabel}`,
    });
    setRescheduling(null);
  };

  const originalTherapist = findTherapist(rescheduling?.therapistId ?? null);
  const newTherapist = findTherapist(newTherapistId);
  // Se compara contra lo efectivamente pagado: el admin puede haber cambiado el precio desde la reserva.
  const priceChanged = !!rescheduling && !!newTherapist && rescheduling.amountPaid !== newTherapist.price;

  // Horarios del terapeuta destino para la fecha elegida; los ocupados se listan deshabilitados.
  const slotLabels = newTherapist && newDate ? offeredSlotLabels(newTherapist, newDate) : [];
  const takenLabels =
    newTherapist && newDate
      ? takenSlotLabels(busySlots, newTherapist.id, newDate, rescheduling?.id)
      : new Set<string>();
  const hasFreeSlot = slotLabels.some((label) => !takenLabels.has(label));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">Mis citas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consulta y reagenda las sesiones registradas a tu nombre o al de tus dependientes.
        </p>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Cargando tus citas…</p>
        </Card>
      ) : myAppointments.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <CalendarClock className="w-10 h-10 text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Todavía no tienes citas agendadas.</p>
          <Button asChild className="gap-2">
            <Link to={ROUTES.booking}>
              <CalendarPlus className="w-4 h-4" />
              <span>Agendar mi primera cita</span>
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {myAppointments.map((appt) => (
            <Card key={appt.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">{appt.attendeeName}</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {appt.bookingCode}
                  </Badge>
                  {appt.status === "cancelled" && (
                    <Badge variant="destructive" className="text-[10px]">
                      Cancelada por el terapeuta
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {findTherapist(appt.therapistId) && (
                    <span className="flex items-center gap-1">
                      <UserRound className="w-3.5 h-3.5 text-primary" />
                      {findTherapist(appt.therapistId)?.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5 text-primary" />
                    {appt.date} · {appt.timeLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    {appt.modality === "online" ? (
                      <Video className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                    )}
                    {appt.modality === "online" ? "Videoconsulta" : "Presencial"}
                  </span>
                </div>
              </div>

              {/* Una cita cancelada solo la reprograma el terapeuta. */}
              {appt.status === "active" && (
                <Button variant="outline" size="sm" onClick={() => openReschedule(appt)} className="gap-1.5 shrink-0">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reagendar</span>
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!rescheduling} onOpenChange={(open) => !open && setRescheduling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar cita</DialogTitle>
            <DialogDescription>
              Elige el terapeuta, la nueva fecha y el horario para {rescheduling?.attendeeName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reschedule-therapist">Terapeuta</Label>
              <select
                id="reschedule-therapist"
                value={newTherapistId}
                onChange={(e) => setNewTherapistId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {activeSpecialists.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name} — {sp.title} ({sp.currencySymbol}{sp.price.toFixed(2)})
                  </option>
                ))}
              </select>
              {priceChanged && (
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  La sesión con {newTherapist?.name} cuesta {newTherapist?.currencySymbol}
                  {newTherapist?.price.toFixed(2)}; la cita original se pagó a {originalTherapist?.currencySymbol}
                  {rescheduling?.amountPaid.toFixed(2)}.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="reschedule-date">Nueva fecha</Label>
              <input
                id="reschedule-date"
                type="date"
                min={todayKey()}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <Label htmlFor="reschedule-time">Nuevo horario</Label>
              <select
                id="reschedule-time"
                value={newTimeLabel}
                onChange={(e) => setNewTimeLabel(e.target.value)}
                disabled={!hasFreeSlot}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                {!hasFreeSlot && <option value="">Sin horarios disponibles en esta fecha</option>}
                {hasFreeSlot && !slotLabels.includes(newTimeLabel) && <option value="">Elige un horario</option>}
                {slotLabels.map((label) => {
                  const taken = takenLabels.has(label);
                  return (
                    <option key={label} value={label} disabled={taken}>
                      {label}
                      {taken ? " — ocupado" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={confirmReschedule}
              disabled={isSaving || !hasFreeSlot || !slotLabels.includes(newTimeLabel) || takenLabels.has(newTimeLabel)}
            >
              Confirmar nuevo horario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
