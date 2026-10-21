import React from "react";
import { Clock, Sun, Sunset, Sparkle, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBusySlots } from "@/hooks/useAppointments";
import { generateDaySlots, takenSlotLabels } from "@/lib/schedule";
import { Specialist, TimeSlot } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Step2TimeProps {
  therapist: Specialist | null;
  dateKey: string | null;
  selectedTime: string | null;
  onSelectTime: (time: string, label: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const Step2Time: React.FC<Step2TimeProps> = ({
  therapist,
  dateKey,
  selectedTime,
  onSelectTime,
  onBack,
  onContinue,
}: Step2TimeProps) => {
  const { busySlots } = useBusySlots(therapist?.id ?? null);
  // El intervalo del terapeuta es la duración de la cita (SPEC 02).
  const minutes = therapist?.slotIntervalMinutes;

  // Solo los horarios que el terapeuta ofrece ese día; los ocupados se muestran deshabilitados.
  const taken = therapist && dateKey ? takenSlotLabels(busySlots, therapist.id, dateKey) : new Set<string>();
  const offeredSlots = therapist && dateKey ? generateDaySlots(therapist, dateKey) : [];
  const morningSlots = offeredSlots.filter((s) => s.period === "morning");
  const afternoonSlots = offeredSlots.filter((s) => s.period === "afternoon");

  const handleChooseSlot = (time: string, label: string) => {
    onSelectTime(time, label);
    toast.success(`Horario seleccionado: ${label}`, {
      description: `Sesión individual de ${minutes} minutos con la especialista.`,
    });
  };

  const renderSlot = (slot: TimeSlot) => {
    const isTaken = taken.has(slot.label);
    const isSelected = !isTaken && selectedTime === slot.time;
    return (
      <button
        key={slot.time}
        type="button"
        disabled={isTaken}
        onClick={() => handleChooseSlot(slot.time, slot.label)}
        className={cn(
          "py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-1 w-full border transition-all",
          isTaken
            ? "border-border bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            : isSelected
              ? "bg-primary text-primary-foreground border-primary shadow-sm cursor-pointer"
              : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent/40 cursor-pointer"
        )}
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 opacity-70" />
          <span>{slot.label}</span>
        </div>
        <span
          className={cn(
            "text-[10px] font-normal",
            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          {isTaken ? "Ocupado" : `${minutes} min`}
        </span>
      </button>
    );
  };

  return (
    <Card>
      <CardHeader className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="secondary" className="text-primary font-semibold">
              Paso 2 de 4
            </Badge>
            <CardTitle className="text-xl font-bold mt-2">
              Elige el horario de tu sesión
            </CardTitle>
            <CardDescription>
              Cada sesión tiene una duración de {minutes} minutos dedicados exclusivamente a ti.
            </CardDescription>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Alerta de tranquilidad */}
        <div className="p-3.5 rounded-xl bg-secondary border border-border flex items-center gap-3 text-xs text-secondary-foreground">
          <Sparkle className="w-4 h-4 text-primary shrink-0" />
          <span>
            Te sugerimos reservar un momento en el que cuentes con total privacidad y un entorno calmado.
          </span>
        </div>

        {offeredSlots.length === 0 && (
          <p className="text-sm text-muted-foreground">
            El terapeuta no tiene horarios disponibles en esta fecha. Vuelve al calendario y elige otro día.
          </p>
        )}

        {/* Turno Mañana */}
        {morningSlots.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-foreground">
              <Sun className="w-4 h-4 text-primary" />
              <span>Turno Mañana</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">{morningSlots.map(renderSlot)}</div>
          </div>
        )}

        {/* Turno Tarde */}
        {afternoonSlots.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-foreground">
              <Sunset className="w-4 h-4 text-primary" />
              <span>Turno Tarde</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">{afternoonSlots.map(renderSlot)}</div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-border pt-4 flex-col-reverse sm:flex-row justify-between gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2 w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Calendario</span>
        </Button>

        <Button
          onClick={() => {
            if (!selectedTime) {
              toast.error("Horario requerido", {
                description: "Por favor elige la hora en que deseas tu consulta.",
              });
              return;
            }
            onContinue();
          }}
          disabled={!selectedTime}
          className="gap-2 w-full sm:w-auto"
        >
          <span>Continuar a Datos del Paciente</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
