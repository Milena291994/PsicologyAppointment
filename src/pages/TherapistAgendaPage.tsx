import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Search,
  IdCard,
  RefreshCw,
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
import { APP_CONFIG } from "@/data/mockData";
import { Appointment } from "@/types";
import { formatShortDate, parseDateKey, todayKey } from "@/lib/date";
import { exportAgendaToExcel } from "@/lib/exportAgenda";
import { toast } from "sonner";

const nativeFieldClass =
  "flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Minúsculas y sin tildes, para que "lucia" encuentre a "Lucía". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function slotOrder(timeLabel: string): number {
  const index = APP_CONFIG.defaultSlots.findIndex((s) => s.label === timeLabel);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export const TherapistAgendaPage: React.FC = () => {
  const currentTherapist = usePatientStore((s) => s.currentTherapist);
  const appointments = usePatientStore((s) => s.appointments);
  const rescheduleAppointment = usePatientStore((s) => s.rescheduleAppointment);

  const today = todayKey();
  const [dateFilter, setDateFilter] = useState(today);
  const [nameFilter, setNameFilter] = useState("");
  const [idFilter, setIdFilter] = useState("");

  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
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
      .sort((a, b) => a.date.localeCompare(b.date) || slotOrder(a.timeLabel) - slotOrder(b.timeLabel));
  }, [myAppointments, dateFilter, nameFilter, idFilter]);

  if (!currentTherapist) return null;

  const hasFilters = dateFilter !== today || nameFilter !== "" || idFilter !== "";

  const clearFilters = () => {
    setDateFilter(today);
    setNameFilter("");
    setIdFilter("");
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

  const openReschedule = (appt: Appointment) => {
    setRescheduling(appt);
    setNewDate(appt.date < today ? today : appt.date);
    setNewTimeLabel(appt.timeLabel);
  };

  /** Horarios ya ocupados por otras citas del terapeuta en la fecha elegida. */
  const takenLabels = new Set(
    myAppointments
      .filter((a) => a.id !== rescheduling?.id && a.date === newDate)
      .map((a) => a.timeLabel)
  );

  const confirmReschedule = () => {
    if (!rescheduling || !newDate || !newTimeLabel) return;

    if (newDate < today) {
      toast.error("Fecha no válida", { description: "No puedes reprogramar una cita a una fecha pasada." });
      return;
    }
    if (APP_CONFIG.disabledDaysOfWeek.includes(parseDateKey(newDate).getDay())) {
      toast.error("Consultorio cerrado", { description: "Ese día no hay atención. Elige otra fecha." });
      return;
    }
    if (newDate === rescheduling.date && newTimeLabel === rescheduling.timeLabel) {
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
      <Card className="p-4 sm:p-5 mb-4">
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
                <TableRow key={appt.id}>
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
                    <Button variant="outline" size="sm" onClick={() => openReschedule(appt)} className="gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reprogramar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

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
                className={nativeFieldClass}
              >
                {APP_CONFIG.defaultSlots.map((slot) => {
                  const taken = takenLabels.has(slot.label);
                  return (
                    <option key={slot.time} value={slot.label} disabled={taken}>
                      {slot.label}
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
            <Button onClick={confirmReschedule}>Confirmar nuevo horario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
