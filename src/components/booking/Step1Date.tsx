import React, { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, ArrowRight, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TentativeDate } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Step1DateProps {
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  onContinue: () => void;
}

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplayDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const formatted = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export const Step1Date: React.FC<Step1DateProps> = ({
  selectedDate,
  onSelectDate,
  onContinue,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

  // Calcular 3 fechas tentativas recomendadas
  const tentativeDates: TentativeDate[] = React.useMemo(() => {
    const list: TentativeDate[] = [];
    const cursor = new Date(today);
    const badges = ["Más cercana", "Recomendada", "Alternativa"];

    while (list.length < 3) {
      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() !== 0) {
        // Excluir domingos
        list.push({
          dateKey: formatDateKey(cursor),
          dateObj: new Date(cursor),
          displayDay: cursor.toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          badgeLabel: badges[list.length],
        });
      }
    }
    return list;
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dateKey: string) => {
    onSelectDate(dateKey);
    toast.info("Fecha seleccionada", {
      description: `${formatDisplayDate(dateKey)}. Ahora elige tu horario ideal.`,
    });
  };

  // Generar cuadrícula de días
  const calendarCells = React.useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    let startOffset = firstDayOfMonth.getDay() - 1; // 0=Lun, 6=Dom
    if (startOffset === -1) startOffset = 6;

    const totalDays = lastDayOfMonth.getDate();
    const cells: React.ReactNode[] = [];

    // Celdas vacías iniciales
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2 opacity-0 pointer-events-none" />);
    }

    // Días del mes
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const dateObj = new Date(currentYear, currentMonth, dayNum);
      const dateKey = formatDateKey(dateObj);
      const isSunday = dateObj.getDay() === 0;
      const isPast = dateObj < today;
      const isToday = formatDateKey(today) === dateKey;
      const isSelected = selectedDate === dateKey;

      if (isPast || isSunday) {
        cells.push(
          <button
            key={dateKey}
            type="button"
            disabled
            className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg text-xs sm:text-sm font-medium opacity-30 cursor-not-allowed text-muted-foreground flex items-center justify-center"
          >
            {dayNum}
          </button>
        );
      } else {
        cells.push(
          <button
            key={dateKey}
            type="button"
            onClick={() => handleSelectDay(dateKey)}
            className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg text-xs sm:text-sm font-medium transition-all relative flex flex-col items-center justify-center cursor-pointer",
              isSelected
                ? "bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/30"
                : "hover:bg-accent text-foreground",
              isToday && !isSelected && "border-1.5 border-primary font-semibold"
            )}
          >
            <span>{dayNum}</span>
            <span
              className={cn(
                "w-1 h-1 rounded-full absolute bottom-1",
                isSelected ? "bg-primary-foreground" : "bg-primary"
              )}
            />
          </button>
        );
      }
    }

    return cells;
  }, [currentMonth, currentYear, selectedDate]);

  return (
    <Card>
      <CardHeader className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="secondary" className="text-primary font-semibold">
              Paso 1 de 4
            </Badge>
            <CardTitle className="text-xl font-bold mt-2">
              Selecciona la fecha para tu sesión
            </CardTitle>
            <CardDescription>
              Elige un día en el calendario o selecciona una de nuestras fechas tentativas recomendadas.
            </CardDescription>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Fechas tentativas recomendadas */}
        <div>
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Fechas tentativas recomendadas más próximas:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tentativeDates.map((item) => (
              <button
                key={item.dateKey}
                type="button"
                onClick={() => {
                  const d = parseDateKey(item.dateKey);
                  setCurrentMonth(d.getMonth());
                  setCurrentYear(d.getFullYear());
                  handleSelectDay(item.dateKey);
                }}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all group focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer",
                  selectedDate === item.dateKey
                    ? "border-primary bg-secondary/80 ring-1 ring-primary"
                    : "border-border bg-card hover:bg-accent/40 hover:border-primary/40"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant="secondary" className="text-[10px] text-primary">
                    {item.badgeLabel}
                  </Badge>
                  <ArrowUpRight className="w-3.5 h-3.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-semibold text-foreground capitalize text-xs sm:text-sm">
                  {item.displayDay}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Cupos disponibles</div>
              </button>
            ))}
          </div>
        </div>

        {/* Calendario shadcn */}
        <div className="border border-border rounded-xl p-4 sm:p-5 bg-card/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold capitalize tracking-tight text-foreground">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Días de semana */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
            <span>Lu</span>
            <span>Ma</span>
            <span>Mi</span>
            <span>Ju</span>
            <span>Vi</span>
            <span>Sá</span>
            <span className="text-destructive/70">Do</span>
          </div>

          {/* Celdas */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">{calendarCells}</div>

          {/* Leyenda */}
          <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-primary inline-block" />
              <span>Día actual</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-muted inline-block" />
              <span>No disponible</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border pt-4 justify-end">
        <Button
          onClick={() => {
            if (!selectedDate) {
              toast.error("Fecha requerida", {
                description: "Por favor selecciona un día en el calendario antes de continuar.",
              });
              return;
            }
            onContinue();
          }}
          className="gap-2 w-full sm:w-auto"
        >
          <span>Continuar a Selección de Hora</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
