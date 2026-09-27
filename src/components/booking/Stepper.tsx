import React from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

const steps = [
  { step: 1, label: "Fecha y Tentativas" },
  { step: 2, label: "Seleccionar Hora" },
  { step: 3, label: "Datos y Confirmación" },
  { step: 4, label: "Pago Payphone" },
];

export const Stepper: React.FC<StepperProps> = ({ currentStep, onStepClick }) => {
  return (
    <Card className="p-3 sm:p-4 mb-8">
      <div className="flex items-center justify-between sm:justify-center sm:gap-8 overflow-x-auto">
        {steps.map((item, index) => {
          const isCurrent = item.step === currentStep;
          const isDone = item.step < currentStep;

          return (
            <React.Fragment key={item.step}>
              <button
                type="button"
                onClick={() => isDone && onStepClick(item.step)}
                disabled={!isDone && !isCurrent}
                className={cn(
                  "flex items-center gap-2.5 focus:outline-none shrink-0 transition-opacity",
                  !isDone && !isCurrent && "cursor-not-allowed opacity-60"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isCurrent &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isDone && "bg-primary text-primary-foreground",
                    !isCurrent &&
                      !isDone &&
                      "bg-card text-muted-foreground border border-border"
                  )}
                >
                  {isDone ? <Check className="w-4 h-4" /> : item.step}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Paso {item.step}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isCurrent
                        ? "text-foreground"
                        : isDone
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </button>

              {index < steps.length - 1 && (
                <div className="w-8 sm:w-12 h-[1px] bg-border shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
};
