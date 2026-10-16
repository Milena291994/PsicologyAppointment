import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Search,
  IdCard,
  RefreshCw,
  Ban,
  Video,
  MapPin,
  X,
  CalendarClock,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePatientStore } from "@/store/usePatientStore";
import { Appointment } from "@/types";
import { formatShortDate, todayKey } from "@/lib/date";
import { exportAgendaToExcel } from "@/lib/exportAgenda";
import { labelToMinutes, offeredSlotLabels, takenSlotLabels } from "@/lib/schedule";
import { toast } from "sonner";

const nativeFieldClass =
  "flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Minúsculas y sin tildes, para que "lucia" encuentre a "Lucía". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

type StatusFilter = "active" | "cancelled" | "all";

export const TherapistAgendaPage: React.FC = () => {
  const currentTherapist = usePatientStore((s) => s.currentTherapist);
  const appointments = usePatientStore((s) => s.appointments);
  const rescheduleAppointment = usePatientStore((s) => s.rescheduleAppointment);
  const cancelAppointment = usePatientStore((s) => s.cancelAppointment);

  const today = todayKey();
  const [dateFilter, setDateFilter] = useState(today);
  const [nameFilter, setNameFilter] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTimeLabel, setNewTimeLabel] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const myAppointments = useMemo(
    () => appointments.filter((a) => a.therapistId === currentTherapist?.id),
    [appointments, currentTherapist]
  );

  const filtered = useMemo(() => {
    const name = normalize(nameFilter);
    const id = idFilter.trim();
    return myAppointments
      .filter((a) => !dateFilter || a.date === dateFilter)
      .filter((a) => !name || normalize(a.attendeeName).includes(name))
      .filter((a) => !id || a.attendeeIdentification.includes(id))
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .sort((a, b) => a.date.localeCompare(b.date) || labelToMinutes(a.timeLabel) - labelToMinutes(b.timeLabel));
  }, [myAppointments, dateFilter, nameFilter, idFilter, statusFilter]);

  if (!currentTherapist) return null;

  const hasFilters = dateFilter !== today || nameFilter !== "" || idFilter !== "" || statusFilter !== "active";

  const clearFilters = () => {
    setDateFilter(today);
    setNameFilter("");
    setIdFilter("");
    setStatusFilter("active");
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAgendaToExcel(filtered, currentTherapist.name, dateFilter);
      toast.success("Agenda exportada", {
        description: `${filtered.length} ${filtered.length === 1 ? "cita" : "citas"} en el archivo Excel.`,
      });
    } catch {
      toast.error("No se pudo exportar", { description: "Inténtalo de nuevo en unos segundos." });
    } finally {
      setIsExporting(false);
    }
  };

  const confirmCancel = () => {
    if (!cancelling) return;
    const result = cancelAppointment(cancelling.id);
    if (!result.ok) {
      toast.error("No se pudo cancelar", { description: result.error });
      return;
    }
    toast.success("Cita cancelada", {
      description: `${cancelling.attendeeName} · ${formatShortDate(cancelling.date)} · ${cancelling.timeLabel}`,
    });
    setCancelling(null);
  };

  const openReschedule = (appt: Appointment) => {
    setRescheduling(appt);
    setNewDate(appt.date < today ? today : appt.date);
    setNewTimeLabel(appt.timeLabel);
  };

  // Horarios de mi horario semanal para la fecha elegida (vacío si el día está cancelado);
  // los ocupados por otras citas activas se listan deshabilitados.
  const slotLabels = newDate ? offeredSlotLabels(currentTherapist, newDate) : [];
  const takenLabels = newDate
    ? takenSlotLabels(appointments, currentTherapist.id, newDate, rescheduling?.id)
    : new Set<string>();
  const hasFreeSlot = slotLabels.some((label) => !takenLabels.has(label));

  const confirmReschedule = () => {
    if (!rescheduling || !newDate || !newTimeLabel) return;

    if (newDate < today) {
      toast.error("Fecha no válida", { description: "No puedes reprogramar una cita a una fecha pasada." });
      return;
    }
    if (currentTherapist.cancelledDates.includes(newDate)) {
      toast.error("Día cancelado", { description: "Cancelaste la atención ese día. Elige otra fecha." });
      return;
    }
    if (!slotLabels.includes(newTimeLabel)) {
      toast.error("Sin atención en ese horario", {
        description: "Ese horario no está en tu horario semanal para esa fecha. Elige otro.",
      });
      return;
    }
    // Una cita cancelada sí puede reactivarse en su mismo día y horario.
    if (rescheduling.status === "active" && newDate === rescheduling.date && newTimeLabel === rescheduling.timeLabel) {
      toast.info("Sin cambios", { description: "Elige una fecha u horario distinto al actual." });
      return;
    }

    const result = rescheduleAppointment(rescheduling.id, currentTherapist.id, newDate, newTimeLabel);
    if (!result.ok) {
      toast.error("Horario no disponible", { description: result.error });
      return;
    }

    toast.success("Cita reprogramada", {
      description: `${rescheduling.attendeeName} · ${formatShortDate(newDate)} · ${newTimeLabel}`,
    });
    setRescheduling(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">Mi agenda</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Citas de {currentTherapist.name}. Filtra por fecha, nombre o cédula del paciente y reprograma cuando
          sea necesario.
        </p>
      </div>

      {/* Filtros */}
      <Card className="p-4 sm:p-5 mb-4 space-y-4">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto] gap-3 items-end">
          <div>
            <Label htmlFor="filter-date">Fecha</Label>
            <div className="flex gap-2">
              <input
                id="filter-date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={nativeFieldClass}
              />
              {dateFilter !== today && (
                <Button variant="outline" size="sm" className="h-10 shrink-0" onClick={() => setDateFilter(today)}>
                  Hoy
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="filter-name">Nombre del paciente</Label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="filter-name"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Ej. Camila Vega"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="filter-id">Cédula</Label>
            <div className="relative">
              <IdCard className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="filter-id"
                inputMode="numeric"
                value={idFilter}
                onChange={(e) => setIdFilter(e.target.value.replace(/\D/g, ""))}
                placeholder="Ej. 1723456789"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={dateFilter ? "outline" : "secondary"}
              className="h-10 flex-1 lg:flex-none"
              onClick={() => setDateFilter("")}
              disabled={!dateFilter}
            >
              Todas las fechas
            </Button>
            {hasFilters && (
              <Button variant="ghost" className="h-10 gap-1.5" onClick={clearFilters} title="Limpiar filtros">
                <X className="w-4 h-4" />
                <span className="lg:sr-only">Limpiar</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span>
            {dateFilter ? formatShortDate(dateFilter) : "Todas las fechas"} ·{" "}
            <strong className="text-foreground">{filtered.length}</strong>{" "}
            {filtered.length === 1 ? "cita" : "citas"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={handleExport}
          disabled={filtered.length === 0 || isExporting}
          title="Exporta las citas visibles con los filtros actuales"
        >
          {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
          <span>Exportar a Excel</span>
        </Button>
      </div>

      {/* Tabla de citas */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CalendarClock className="w-10 h-10 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              {myAppointments.length === 0
                ? "Todavía no tienes citas agendadas."
                : "No hay citas que coincidan con los filtros seleccionados."}
            </p>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Modalidad</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((appt) => (
                <TableRow key={appt.id} className={appt.status === "cancelled" ? "bg-muted/40" : undefined}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatShortDate(appt.date)}</TableCell>
                  <TableCell className="whitespace-nowrap font-semibold text-foreground tabular-nums">
                    {appt.timeLabel}
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{appt.attendeeName}</span>
                      {appt.attendeeType === "dependent" && (
                        <Badge variant="secondary" className="text-[10px]">
                          Menor
                        </Badge>
                      )}
                      {appt.status === "cancelled" && (
                        <Badge variant="destructive" className="text-[10px]">
                          Cancelada
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums">
                    {appt.attendeeIdentification || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      {appt.modality === "online" ? (
                        <Video className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                      )}
                      {appt.modality === "online" ? "Videoconsulta" : "Presencial"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {appt.bookingCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openReschedule(appt)} className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reprogramar</span>
                      </Button>
                      {appt.status === "active" && appt.date >= today && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelling(appt)}
                          className="gap-1.5 text-destructive hover:text-destructive"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!cancelling} onOpenChange={(open) => !open && setCancelling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar cita</DialogTitle>
            <DialogDescription>
              {cancelling && (
                <>
                  Se cancelará la cita de {cancelling.attendeeName} del {formatShortDate(cancelling.date)} a las{" "}
                  {cancelling.timeLabel}. El paciente la verá como cancelada y podrás reprogramarla desde el filtro
                  "Canceladas".
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelling(null)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Cancelar cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rescheduling} onOpenChange={(open) => !open && setRescheduling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar cita</DialogTitle>
            <DialogDescription>
              {rescheduling && (
                <>
                  {rescheduling.attendeeName} · actualmente el {formatShortDate(rescheduling.date)} a las{" "}
                  {rescheduling.timeLabel}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reschedule-date">Nueva fecha</Label>
              <input
                id="reschedule-date"
                type="date"
                min={today}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={nativeFieldClass}
              />
            </div>

            <div>
              <Label htmlFor="reschedule-time">Nuevo horario</Label>
              <select
                id="reschedule-time"
                value={newTimeLabel}
                onChange={(e) => setNewTimeLabel(e.target.value)}
                disabled={!hasFreeSlot}
                className={`${nativeFieldClass} disabled:opacity-60`}
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
            <Button variant="outline" onClick={() => setRescheduling(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmReschedule}
              disabled={!hasFreeSlot || !slotLabels.includes(newTimeLabel) || takenLabels.has(newTimeLabel)}
            >
              Confirmar nuevo horario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
