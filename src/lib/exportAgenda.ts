import { Appointment } from "@/types";
import { formatDateKey, formatShortDate } from "@/lib/date";

/** Nombre de archivo seguro: sin tildes, espacios ni símbolos. */
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * Descarga las citas indicadas como .xlsx. SheetJS se importa dinámicamente para que
 * solo se descargue cuando el terapeuta exporta, no en la carga inicial de la app.
 */
export async function exportAgendaToExcel(
  appointments: Appointment[],
  therapistName: string,
  dateFilter: string
): Promise<void> {
  const XLSX = await import("xlsx");

  const rows = appointments.map((a) => ({
    Fecha: formatShortDate(a.date),
    Hora: a.timeLabel,
    Paciente: a.attendeeName,
    Tipo: a.attendeeType === "dependent" ? "Menor (dependiente)" : "Titular",
    Cédula: a.attendeeIdentification,
    Modalidad: a.modality === "online" ? "Videoconsulta" : "Presencial",
    Código: a.bookingCode,
    Estado: a.status === "cancelled" ? "Cancelada" : "Activa",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 20 },
    { wch: 10 },
    { wch: 32 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Agenda");

  const period = dateFilter || "todas-las-fechas";
  XLSX.writeFile(workbook, `agenda-${slugify(therapistName)}-${period}.xlsx`);
}

/** Descarga los pagos del periodo como .xlsx, con una fila final de total. */
export async function exportRevenueToExcel(
  payments: Appointment[],
  therapistName: string,
  fromKey: string,
  toKey: string
): Promise<void> {
  const XLSX = await import("xlsx");

  const rows: Record<string, string | number>[] = payments.map((a) => ({
    "Fecha de pago": formatShortDate(formatDateKey(new Date(a.createdAt))),
    "Fecha de sesión": formatShortDate(a.date),
    Paciente: a.attendeeName,
    Cédula: a.attendeeIdentification,
    Modalidad: a.modality === "online" ? "Videoconsulta" : "Presencial",
    Código: a.bookingCode,
    "Monto (USD)": a.amountPaid,
  }));
  rows.push({ "Fecha de pago": "TOTAL", "Monto (USD)": payments.reduce((sum, a) => sum + a.amountPaid, 0) });

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Ingresos");
  XLSX.writeFile(workbook, `ingresos-${slugify(therapistName)}-${fromKey}_${toKey}.xlsx`);
}
