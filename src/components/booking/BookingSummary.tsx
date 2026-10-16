import React from "react";
import { Calendar, Clock, Video, User, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PatientFormData, Modality, Specialist } from "@/types";

interface BookingSummaryProps {
  selectedDate: string | null;
  selectedTimeLabel: string | null;
  modality: Modality;
  formData: PatientFormData;
  selectedTherapist: Specialist | null;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedDate,
  selectedTimeLabel,
  modality,
  formData,
  selectedTherapist,
}) => {
  return (
    <aside className="space-y-6">
      {/* Resumen dinámico en vivo */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground text-sm">Resumen de tu selección</h3>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/40">
            <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground block text-[10px] font-semibold uppercase">
                Fecha
              </span>
              <span className="font-medium text-foreground">
                {selectedDate || "Por seleccionar"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/40">
            <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground block text-[10px] font-semibold uppercase">
                Horario
              </span>
              <span className="font-medium text-foreground">
                {selectedTimeLabel ? `${selectedTimeLabel} (${selectedTherapist?.slotIntervalMinutes} min)` : "Por seleccionar"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/40">
            <Video className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground block text-[10px] font-semibold uppercase">
                Modalidad
              </span>
              <span className="font-medium text-foreground">
                {modality === "online"
                  ? "Videoconsulta confidencial (Meet / Zoom Salud)"
                  : "Presencial (Consultorio Psicología y Mente)"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/40">
            <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground block text-[10px] font-semibold uppercase">
                Paciente
              </span>
              <span className="font-medium text-foreground">
                {formData.fullName
                  ? `${formData.fullName} (${formData.identification || "Sin ID"})`
                  : "Pendiente de ingreso"}
              </span>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Inversión de la sesión:</span>
          <span className="text-base font-bold text-primary">
            {selectedTherapist
              ? `${selectedTherapist.currencySymbol}${selectedTherapist.price.toFixed(2)} ${selectedTherapist.currency}`
              : "Por seleccionar"}
          </span>
        </div>
      </Card>

      {/* Preguntas frecuentes */}
      <Card className="p-5 border-border bg-secondary/20 text-xs text-muted-foreground space-y-2.5">
        <h4 className="font-bold text-foreground flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-primary" />
          <span>Preguntas Frecuentes</span>
        </h4>
        <div className="space-y-2 text-[11px] leading-relaxed">
          <p>
            <strong className="text-foreground">¿Cómo recibiré el enlace?</strong> Te llegará automáticamente por correo y WhatsApp con recordatorio previo.
          </p>
          <p>
            <strong className="text-foreground">¿Puedo reagendar?</strong> Sí, puedes cambiar la fecha con hasta 12 horas de anticipación sin costo adicional.
          </p>
        </div>
      </Card>
    </aside>
  );
};
