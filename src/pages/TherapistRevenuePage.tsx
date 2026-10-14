import React, { useMemo, useState } from "react";
import {
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
  Minus,
  Video,
  MapPin,
  FileSpreadsheet,
  Loader2,
  CalendarRange,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { usePatientStore } from "@/store/usePatientStore";
import { Appointment } from "@/types";
import {
  addDaysToKey,
  daysBetweenInclusive,
  formatDateKey,
  formatShortDate,
  parseDateKey,
  todayKey,
} from "@/lib/date";
import { exportRevenueToExcel } from "@/lib/exportAgenda";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const nativeFieldClass =
  "flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const money = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

/** Fecha local "YYYY-MM-DD" en que se cobró la cita. */
function paidDateKey(appt: Appointment): string {
  return formatDateKey(new Date(appt.createdAt));
}

interface DateRange {
  from: string;
  to: string;
}

const PRESETS: { id: string; label: string; range: () => DateRange }[] = [
  {
    id: "month",
    label: "Este mes",
    range: () => {
      const now = new Date();
      return { from: formatDateKey(new Date(now.getFullYear(), now.getMonth(), 1)), to: todayKey() };
    },
  },
  {
    id: "prev-month",
    label: "Mes anterior",
    range: () => {
      const now = new Date();
      return {
        from: formatDateKey(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: formatDateKey(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    },
  },
  { id: "30d", label: "Últimos 30 días", range: () => ({ from: addDaysToKey(todayKey(), -29), to: todayKey() }) },
  { id: "90d", label: "Últimos 90 días", range: () => ({ from: addDaysToKey(todayKey(), -89), to: todayKey() }) },
  {
    id: "year",
    label: "Este año",
    range: () => ({ from: formatDateKey(new Date(new Date().getFullYear(), 0, 1)), to: todayKey() }),
  },
];

interface Bucket {
  key: string;
  label: string;
  /** Texto completo del periodo para el tooltip. */
  title: string;
  total: number;
  count: number;
}

/**
 * Agrupa los pagos por día (≤ 31 días), semana (≤ 120 días) o mes, incluyendo los periodos
 * sin ingresos para que el gráfico no oculte los huecos.
 */
function buildBuckets(payments: Appointment[], range: DateRange): Bucket[] {
  const span = daysBetweenInclusive(range.from, range.to);
  const unit: "day" | "week" | "month" = span <= 31 ? "day" : span <= 120 ? "week" : "month";

  const bucketStart = (dateKey: string): string => {
    const date = parseDateKey(dateKey);
    if (unit === "day") return dateKey;
    if (unit === "month") return formatDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
    const mondayOffset = (date.getDay() + 6) % 7;
    return addDaysToKey(dateKey, -mondayOffset);
  };

  const buckets = new Map<string, Bucket>();
  let cursor = bucketStart(range.from);
  while (cursor <= range.to) {
    const date = parseDateKey(cursor);
    let next: string;
    let label: string;
    let title: string;
    if (unit === "day") {
      next = addDaysToKey(cursor, 1);
      label = String(date.getDate());
      title = formatShortDate(cursor);
    } else if (unit === "week") {
      next = addDaysToKey(cursor, 7);
      label = date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
      title = `Semana del ${formatShortDate(cursor < range.from ? range.from : cursor)}`;
    } else {
      next = formatDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 1));
      label = date.toLocaleDateString("es-ES", { month: "short" });
      title = date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    }
    buckets.set(cursor, { key: cursor, label, title, total: 0, count: 0 });
    cursor = next;
  }

  for (const p of payments) {
    const bucket = buckets.get(bucketStart(paidDateKey(p)));
    if (bucket) {
      bucket.total += p.amountPaid;
      bucket.count += 1;
    }
  }
  return [...buckets.values()];
}

/** Tope "redondo" del eje Y (1, 2 o 5 × 10ⁿ) para que las líneas guía tengan valores legibles. */
function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * magnitude >= value) ?? 10;
  return step * magnitude;
}

function sumOf(list: Appointment[]): number {
  return list.reduce((sum, a) => sum + a.amountPaid, 0);
}

export const TherapistRevenuePage: React.FC = () => {
  const currentTherapist = usePatientStore((s) => s.currentTherapist);
  const appointments = usePatientStore((s) => s.appointments);

  const [range, setRange] = useState<DateRange>(PRESETS[0].range);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const isValidRange = !!range.from && !!range.to && range.from <= range.to;
  const today = todayKey();

  const myPayments = useMemo(
    () => appointments.filter((a) => a.therapistId === currentTherapist?.id),
    [appointments, currentTherapist]
  );

  const inRange = useMemo(() => {
    if (!isValidRange) return [];
    return myPayments
      .filter((a) => {
        const key = paidDateKey(a);
        return key >= range.from && key <= range.to;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [myPayments, range, isValidRange]);

  /** Mismo número de días inmediatamente antes del periodo elegido. */
  const previousTotal = useMemo(() => {
    if (!isValidRange) return 0;
    const span = daysBetweenInclusive(range.from, range.to);
    const prevTo = addDaysToKey(range.from, -1);
    const prevFrom = addDaysToKey(range.from, -span);
    return sumOf(
      myPayments.filter((a) => {
        const key = paidDateKey(a);
        return key >= prevFrom && key <= prevTo;
      })
    );
  }, [myPayments, range, isValidRange]);

  const buckets = useMemo(() => (isValidRange ? buildBuckets(inRange, range) : []), [inRange, range, isValidRange]);

  if (!currentTherapist) return null;

  const total = sumOf(inRange);
  const sessions = inRange.length;
  const average = sessions ? total / sessions : 0;
  const onlineTotal = sumOf(inRange.filter((a) => a.modality === "online"));
  const presencialTotal = total - onlineTotal;
  const change = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null;

  const activePreset = PRESETS.find((p) => {
    const r = p.range();
    return r.from === range.from && r.to === range.to;
  })?.id;

  const yMax = niceMax(Math.max(0, ...buckets.map((b) => b.total)));
  const labelEvery = Math.ceil(buckets.length / 12);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportRevenueToExcel(inRange, currentTherapist.name, range.from, range.to);
      toast.success("Reporte exportado", {
        description: `${sessions} ${sessions === 1 ? "pago" : "pagos"} · ${money.format(total)}`,
      });
    } catch {
      toast.error("No se pudo exportar", { description: "Inténtalo de nuevo en unos segundos." });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">Ingresos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dinero recaudado por {currentTherapist.name} a través de Payphone, según la fecha de pago.
        </p>
      </div>

      {/* Rango de fechas */}
      <Card className="p-4 sm:p-5 mb-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              size="sm"
              variant={activePreset === preset.id ? "default" : "outline"}
              onClick={() => setRange(preset.range())}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:max-w-md">
          <div>
            <Label htmlFor="revenue-from">Desde</Label>
            <input
              id="revenue-from"
              type="date"
              max={range.to || today}
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className={nativeFieldClass}
            />
          </div>
          <div>
            <Label htmlFor="revenue-to">Hasta</Label>
            <input
              id="revenue-to"
              type="date"
              min={range.from}
              max={today}
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className={nativeFieldClass}
            />
          </div>
        </div>
        {!isValidRange && (
          <p className="text-sm text-destructive">La fecha "Desde" debe ser anterior o igual a la fecha "Hasta".</p>
        )}
      </Card>

      {isValidRange && (
        <>
          {/* Indicadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Card className="p-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Wallet className="w-4 h-4 text-primary" />
                Total recaudado
              </div>
              <p className="font-display text-3xl font-semibold text-foreground tabular-nums mt-2">
                {money.format(total)}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {change === null ? (
                  "Sin ingresos en el periodo anterior"
                ) : (
                  <>
                    {change > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : change < 0 ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                    <span className="tabular-nums">
                      {change > 0 ? "+" : ""}
                      {change.toFixed(0)}%
                    </span>
                    vs. los {daysBetweenInclusive(range.from, range.to)} días anteriores
                  </>
                )}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Receipt className="w-4 h-4 text-primary" />
                Sesiones pagadas
              </div>
              <p className="font-display text-3xl font-semibold text-foreground tabular-nums mt-2">{sessions}</p>
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                Promedio {money.format(average)} por sesión
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Video className="w-4 h-4 text-primary" />
                Videoconsulta
              </div>
              <p className="font-display text-2xl font-semibold text-foreground tabular-nums mt-2">
                {money.format(onlineTotal)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                {total ? Math.round((onlineTotal / total) * 100) : 0}% del total
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                Presencial
              </div>
              <p className="font-display text-2xl font-semibold text-foreground tabular-nums mt-2">
                {money.format(presencialTotal)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                {total ? Math.round((presencialTotal / total) * 100) : 0}% del total
              </p>
            </Card>
          </div>

          {/* Gráfico de ingresos por periodo */}
          <Card className="p-4 sm:p-5 mb-4">
            <h2 className="text-sm font-semibold text-foreground mb-4">Ingresos por periodo</h2>
            <div className="flex gap-2">
              {/* Eje Y */}
              <div className="flex flex-col justify-between h-48 text-[10px] text-muted-foreground tabular-nums text-right shrink-0 -mt-1.5">
                <span>{money.format(yMax)}</span>
                <span>{money.format(yMax / 2)}</span>
                <span>{money.format(0)}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="relative h-48" onMouseLeave={() => setHovered(null)}>
                  {/* Líneas guía */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-t border-border/60" />
                    <div className="border-t border-border/60" />
                    <div className="border-t border-border" />
                  </div>

                  <div className="absolute inset-0 flex items-end gap-[2px]">
                    {buckets.map((bucket, index) => (
                      <button
                        key={bucket.key}
                        type="button"
                        className="relative flex-1 h-full flex items-end justify-center focus-visible:outline-none group"
                        onMouseEnter={() => setHovered(index)}
                        onFocus={() => setHovered(index)}
                        onBlur={() => setHovered(null)}
                        aria-label={`${bucket.title}: ${money.format(bucket.total)}, ${bucket.count} ${
                          bucket.count === 1 ? "sesión" : "sesiones"
                        }`}
                      >
                        <span
                          className={cn(
                            "w-full max-w-10 rounded-t bg-primary transition-opacity group-focus-visible:ring-2 group-focus-visible:ring-ring",
                            hovered !== null && hovered !== index && "opacity-50"
                          )}
                          style={{ height: `${(bucket.total / yMax) * 100}%` }}
                        />
                      </button>
                    ))}
                  </div>

                  {hovered !== null && buckets[hovered] && (
                    <div
                      className="absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md pointer-events-none whitespace-nowrap"
                      style={{
                        left: `${Math.min(85, Math.max(15, ((hovered + 0.5) / buckets.length) * 100))}%`,
                      }}
                    >
                      <p className="font-medium text-foreground">{buckets[hovered].title}</p>
                      <p className="text-muted-foreground tabular-nums">
                        <strong className="text-foreground">{money.format(buckets[hovered].total)}</strong> ·{" "}
                        {buckets[hovered].count} {buckets[hovered].count === 1 ? "sesión" : "sesiones"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Eje X */}
                <div className="flex gap-[2px] mt-1.5">
                  {buckets.map((bucket, index) => (
                    <span
                      key={bucket.key}
                      className="flex-1 min-w-0 text-center text-[10px] text-muted-foreground overflow-visible whitespace-nowrap"
                    >
                      {index % labelEvery === 0 ? bucket.label : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Detalle de pagos */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarRange className="w-4 h-4 text-primary" />
              <span>
                {formatShortDate(range.from)} – {formatShortDate(range.to)} ·{" "}
                <strong className="text-foreground">{sessions}</strong> {sessions === 1 ? "pago" : "pagos"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={handleExport}
              disabled={sessions === 0 || isExporting}
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
              <span>Exportar a Excel</span>
            </Button>
          </div>

          <Card className="overflow-hidden">
            {sessions === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Wallet className="w-10 h-10 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">No hay pagos registrados en este periodo.</p>
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Fecha de pago</TableHead>
                      <TableHead>Sesión</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Modalidad</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inRange.map((appt) => (
                      <TableRow key={appt.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatShortDate(paidDateKey(appt))}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatShortDate(appt.date)} · {appt.timeLabel}
                        </TableCell>
                        <TableCell className="min-w-[160px] font-medium text-foreground">{appt.attendeeName}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {appt.modality === "online" ? "Videoconsulta" : "Presencial"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {appt.bookingCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground tabular-nums whitespace-nowrap">
                          {money.format(appt.amountPaid)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
