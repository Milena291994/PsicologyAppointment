import React from "react";
import { CreditCard, Lock, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PatientFormData, Modality, Specialist } from "@/types";

interface Step4PaymentProps {
  formData: PatientFormData;
  modality: Modality;
  selectedTherapist: Specialist | null;
  onOpenPayphone: () => void;
  onBack: () => void;
}

export const Step4Payment: React.FC<Step4PaymentProps> = ({
  formData,
  modality,
  selectedTherapist,
  onOpenPayphone,
  onBack,
}) => {
  const price = selectedTherapist?.price ?? 0;

  return (
    <Card>
      <CardHeader className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs uppercase font-semibold">
              Paso 4 de 4 • Pago Seguro
            </Badge>
            <CardTitle className="text-xl font-bold mt-2">
              Agendar y Pagar con Payphone
            </CardTitle>
            <CardDescription>
              Completa tu reserva de manera transparente mediante la pasarela certificada Payphone.
            </CardDescription>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-payphone flex items-center justify-center shrink-0 border border-orange-100">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Resumen de la consulta */}
        <div className="border border-border rounded-xl p-5 bg-card/80 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Resumen de la Consulta
            </span>
            <Badge variant="secondary">
              {modality === "online" ? "Videoconsulta" : "Presencial"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Paciente Titular:</span>
              <span className="font-bold text-foreground text-sm">
                {formData.fullName || "—"}
              </span>
              <span className="text-muted-foreground block text-[11px]">
                {formData.identification ? `ID: ${formData.identification}` : "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Contacto de Notificación:</span>
              <span className="font-medium text-foreground">
                {formData.email} • {formData.phone}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground block text-[11px]">Especialista asignado:</span>
              <span className="font-medium text-foreground">
                {selectedTherapist?.name || "—"}
              </span>
            </div>
          </div>

          {/* Desglose */}
          <div className="border-t border-border pt-3 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Sesión Psicológica Clínica Individual ({selectedTherapist?.slotIntervalMinutes} min):</span>
              <span className="font-semibold text-foreground">${price.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>IVA 0% (Servicio de Salud exento de gravamen):</span>
              <span>$0.00 USD</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-foreground pt-2 border-t border-border">
              <span className="text-base text-primary">Total a pagar:</span>
              <span className="text-xl text-primary">${price.toFixed(2)} USD</span>
            </div>
          </div>
        </div>

        {/* Info Payphone */}
        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-payphone text-white flex items-center justify-center shrink-0 shadow-sm">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-foreground text-sm">Pago Oficial con Payphone</h4>
              <Badge className="bg-orange-100 text-orange-800 text-[10px] font-bold">Oficial</Badge>
            </div>
            <p className="mt-1 text-muted-foreground leading-relaxed">
              Payphone protege tu transacción mediante certificación bancaria PCI-DSS. Puedes abonar mediante tu{" "}
              <strong>billetera Payphone</strong> o cualquier <strong>tarjeta de crédito / débito</strong> (Visa, Mastercard, etc.).
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-primary" /> Cifrado SSL 256 bits
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-primary" /> Sin comisiones extra
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-primary" /> Comprobante inmediato
              </span>
            </div>
          </div>
        </div>

        {/* Botón Payphone */}
        <div className="space-y-2 pt-2">
          <Button
            variant="payphone"
            size="lg"
            onClick={onOpenPayphone}
            className="btn-payphone w-full font-bold text-base gap-2 group cursor-pointer"
          >
            <CreditCard className="w-5 h-5" />
            <span>Agendar y Pagar con Payphone (${price.toFixed(2)} USD)</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Serás transferido de forma segura a Payphone para finalizar tu pago con tarjeta o app móvil.
          </p>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border pt-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Modificar mis datos o fecha</span>
        </Button>
      </CardFooter>
    </Card>
  );
};
