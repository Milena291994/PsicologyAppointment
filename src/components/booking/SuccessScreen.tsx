import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Check, CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PatientFormData, Modality, Specialist } from "@/types";
import { APP_CONFIG } from "@/data/mockData";
import { ROUTES } from "@/routes/paths";

interface SuccessScreenProps {
  bookingCode: string;
  selectedDate: string | null;
  selectedTimeLabel: string | null;
  modality: Modality;
  formData: PatientFormData;
  selectedTherapist: Specialist | null;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  bookingCode,
  selectedDate,
  selectedTimeLabel,
  modality,
  formData,
  selectedTherapist,
}) => {
  const therapistName = selectedTherapist?.name || APP_CONFIG.clinicName;
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card className="p-6 sm:p-10 text-center shadow-lg border-primary/20">
        <div className="w-16 h-16 rounded-full bg-secondary text-primary flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>

        <Badge variant="secondary" className="text-xs uppercase font-bold text-primary">
          ¡Cita Confirmada y Pagada!
        </Badge>

        <h2 className="font-display text-2xl font-semibold text-foreground mt-3">
          Tu espacio terapéutico está reservado
        </h2>
        <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
          Hemos recibido tu pago a través de Payphone. Te enviamos el comprobante y el enlace privado de videoconsulta a tu correo electrónico.
        </p>

        {/* Código de reserva */}
        <div className="my-6 p-4 rounded-xl bg-muted/40 border border-border inline-block text-center px-8">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
            Código de Reserva
          </span>
          <span className="font-mono text-xl font-semibold text-primary tracking-wider">
            {bookingCode}
          </span>
        </div>

        {/* Detalles de la cita confirmada */}
        <div className="bg-card p-5 rounded-xl text-left border border-border space-y-2 text-xs mb-6">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Especialista:</span>
            <span className="font-semibold text-foreground">
              {therapistName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Centro:</span>
            <span className="font-semibold text-foreground">{APP_CONFIG.clinicName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha:</span>
            <span className="font-semibold text-primary">{selectedDate || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hora:</span>
            <span className="font-semibold text-foreground">
              {selectedTimeLabel ? `${selectedTimeLabel} (50 min)` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modalidad:</span>
            <span className="font-medium text-foreground">
              {modality === "online"
                ? "Videoconsulta Segura (Enlace enviado a tu email)"
                : "Presencial (Consultorio Psicología y Mente, Piso 3)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paciente:</span>
            <span className="font-semibold text-foreground">{formData.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Notificaciones enviadas a:</span>
            <span className="font-medium text-foreground">{formData.email}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="text-muted-foreground font-bold">Estado del Pago:</span>
            <span className="text-primary font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Aprobado vía Payphone
            </span>
          </div>
        </div>

        {/* Acción */}
        <div className="flex justify-center">
          <Button asChild className="h-11 px-5 text-xs gap-2 w-full sm:w-auto">
            <Link to={ROUTES.appointments}>
              <CalendarCheck className="w-4 h-4" />
              <span>Ver mis citas</span>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};
