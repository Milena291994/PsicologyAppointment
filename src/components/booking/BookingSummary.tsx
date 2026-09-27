import React from "react";
import { Star, Calendar, Clock, Video, User, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/data/mockData";
import { PatientFormData, Modality } from "@/types";

interface BookingSummaryProps {
  selectedDate: string | null;
  selectedTimeLabel: string | null;
  modality: Modality;
  formData: PatientFormData;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedDate,
  selectedTimeLabel,
  modality,
  formData,
}) => {
  const spec = APP_CONFIG.specialist;

  return (
    <aside className="space-y-6">
      {/* Tarjeta del Especialista */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3.5">
          <img
            src={spec.avatar}
            alt={spec.name}
            className="w-14 h-14 rounded-xl object-cover shadow-sm ring-1 ring-border"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                Especialista
              </Badge>
              <div className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{spec.rating}</span>
              </div>
            </div>
            <h3 className="font-bold text-foreground text-sm sm:text-base mt-0.5">
              {spec.name}
            </h3>
            <p className="text-xs text-muted-foreground">{spec.title.split("•")[0]}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border">
          "{spec.about.slice(0, 155)}..."
        </p>

        <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
          <div className="bg-secondary/60 p-2 rounded-lg border border-border/50">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
              Experiencia
            </span>
            <span className="font-bold text-foreground">{spec.experienceYears}+ años</span>
          </div>
          <div className="bg-secondary/60 p-2 rounded-lg border border-border/50">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
              Registro MSP
            </span>
            <span className="font-bold text-foreground">{spec.registry.split("#")[1] ? `#${spec.registry.split("#")[1]}` : spec.registry}</span>
          </div>
        </div>
      </Card>

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
                {selectedTimeLabel ? `${selectedTimeLabel} (50 min)` : "Por seleccionar"}
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
            ${spec.price.toFixed(2)} {spec.currency}
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
