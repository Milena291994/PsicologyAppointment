import React, { useState } from "react";
import { ExternalLink, ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PatientFormData, Specialist } from "@/types";
import { APP_CONFIG } from "@/data/mockData";
import { toast } from "sonner";

interface PayphoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PatientFormData;
  selectedTherapist: Specialist | null;
  onPaymentSuccess: () => void;
}

export const PayphoneModal: React.FC<PayphoneModalProps> = ({
  open,
  onOpenChange,
  formData,
  selectedTherapist,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleDirectLink = () => {
    toast.info("Enlace de cobro", {
      description: "Redirigiendo a la pasarela web de Payphone...",
    });
    window.open(APP_CONFIG.payphone.paymentUrl, "_blank", "noopener,noreferrer");
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    toast.info("Procesando en Payphone...", {
      description: "Verificando acreditación del pago seguro.",
    });

    setTimeout(() => {
      setIsProcessing(false);
      onOpenChange(false);
      toast.success("¡Pago aprobado en Payphone!", {
        description: "Tu cita psicológica ha sido confirmada con éxito.",
      });
      onPaymentSuccess();
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-6 sm:p-7 shadow-2xl">
        <DialogHeader className="text-center sm:text-center mb-2">
          <div className="mx-auto inline-flex items-center gap-2 bg-[#ff5b00] text-white px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm">
            <span>Payphone</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="font-normal text-[10px]">Checkout Oficial</span>
          </div>
          <DialogTitle className="text-lg mt-3 text-center">
            Completar Pago de Consulta
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5 text-center">
            Comercio: <strong>{APP_CONFIG.payphone.merchantName}</strong>
          </p>
          <div className="mt-2 text-2xl font-black text-[#ff5b00] text-center">
            ${(selectedTherapist?.price ?? 0).toFixed(2)} USD
          </div>
        </DialogHeader>

        {/* Resumen del paciente */}
        <div className="bg-muted/40 p-3 rounded-lg border border-border text-xs mb-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paciente titular:</span>
            <span className="font-medium text-foreground">{formData.fullName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Teléfono registrado:</span>
            <span className="font-medium text-foreground">{formData.phone || "—"}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDirectLink}
            className="w-full h-11 border-orange-500/80 hover:bg-orange-50/50 text-[#ff5b00] font-bold text-xs sm:text-sm justify-between px-4 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <span>Abrir enlace web directo de Payphone</span>
            </div>
            <ArrowUpRight className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="payphone"
            disabled={isProcessing}
            onClick={handleSimulatePayment}
            className="w-full h-11 font-bold text-xs sm:text-sm shadow-md gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aprobando transacción...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simular Pago Aprobado en Payphone</span>
              </>
            )}
          </Button>
        </div>

        <div className="text-center text-[10px] text-muted-foreground pt-1">
          Transacción protegida por cifrado SSL 256 bits y certificación PCI-DSS.
        </div>
      </DialogContent>
    </Dialog>
  );
};
