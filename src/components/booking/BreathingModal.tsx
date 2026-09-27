import React, { useState, useEffect } from "react";
import { Wind } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface BreathingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const phases = [
  "Inhala profundamente por la nariz...",
  "Sostén con calma y tranquilidad...",
  "Exhala suavemente por la boca...",
  "Descansa y siente la quietud...",
];

export const BreathingModal: React.FC<BreathingModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [phaseIndex, setPhaseIndex] = useState<number>(0);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full p-8 text-center shadow-2xl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto">
            <Badge variant="secondary" className="text-xs uppercase font-bold text-primary">
              Pausa Consciente
            </Badge>
          </div>
          <DialogTitle className="text-lg mt-3 text-center">Tómate un respiro</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Sigue el ritmo del círculo para centrar tu mente y calmar tu cuerpo.
          </p>
        </DialogHeader>

        <div className="my-6 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-primary/20 border-2 border-primary/40 breathing-circle flex items-center justify-center text-primary shadow-lg">
            <Wind className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="text-sm font-semibold text-primary min-h-[24px]">
          {phases[phaseIndex]}
        </div>
      </DialogContent>
    </Dialog>
  );
};
