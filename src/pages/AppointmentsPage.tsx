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
import { usePatientStore } from "@/store/usePatientStore";
import { APP_CONFIG } from "@/data/mockData";
import { Appointment } from "@/types";
import { toast } from "sonner";

export const AppointmentsPage: React.FC = () => {
  const currentPatient = usePatientStore((s) => s.currentPatient);
  const appointments = usePatientStore((s) => s.appointments);
  const rescheduleAppointment = usePatientStore((s) => s.rescheduleAppointment);

  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [newTherapistId, setNewTherapistId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  if (!currentPatient) return null;

  const ownedIds = new Set([currentPatient.id, ...currentPatient.dependents.map((d) => d.id)]);
  const myAppointments = appointments.filter((a) => ownedIds.has(a.attendeeId));

  const findTherapist = (id: string | null) => APP_CONFIG.specialists.find((sp) => sp.id === id) || null;

  const openReschedule = (appt: Appointment) => {
    setRescheduling(appt);
    setNewTherapistId(appt.therapistId || APP_CONFIG.specialists[0].id);
    setNewDate(appt.date);
    const matchingSlot = APP_CONFIG.defaultSlots.find((s) => s.label === appt.timeLabel);
    setNewTime(matchingSlot?.time || APP_CONFIG.defaultSlots[0].time);
  };

  const confirmReschedule = () => {
    if (!rescheduling || !newTherapistId || !newDate || !newTime) return;
    const slot = APP_CONFIG.defaultSlots.find((s) => s.time === newTime);
    rescheduleAppointment(rescheduling.id, newTherapistId, newDate, slot?.label || newTime);
    toast.success("Cita reagendada", {
      description: `${findTherapist(newTherapistId)?.name} · ${newDate} · ${slot?.label || newTime}`,
    });
    setRescheduling(null);
  };

  const originalTherapist = findTherapist(rescheduling?.therapistId ?? null);
  const newTherapist = findTherapist(newTherapistId);
  const priceChanged = !!originalTherapist && !!newTherapist && originalTherapist.price !== newTherapist.price;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">Mis citas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consulta y reagenda las sesiones registradas a tu nombre o al de tus dependientes.
        </p>
      </div>

      {myAppointments.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <CalendarClock className="w-10 h-10 text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Todavía no tienes citas agendadas.</p>
          <Button asChild className="gap-2">
            <Link to="/agendar">
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

              <Button variant="outline" size="sm" onClick={() => openReschedule(appt)} className="gap-1.5 shrink-0">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reagendar</span>
              </Button>
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
                {APP_CONFIG.specialists.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name} — {sp.title} ({sp.currencySymbol}{sp.price.toFixed(2)})
                  </option>
                ))}
              </select>
              {priceChanged && (
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  La sesión con {newTherapist?.name} cuesta {newTherapist?.currencySymbol}
                  {newTherapist?.price.toFixed(2)}; la cita original se pagó a {originalTherapist?.currencySymbol}
                  {originalTherapist?.price.toFixed(2)}.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="reschedule-date">Nueva fecha</Label>
              <input
                id="reschedule-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <Label htmlFor="reschedule-time">Nuevo horario</Label>
              <select
                id="reschedule-time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {APP_CONFIG.defaultSlots.map((slot) => (
                  <option key={slot.time} value={slot.time}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={confirmReschedule}>Confirmar nuevo horario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
