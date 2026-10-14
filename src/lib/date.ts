/** Clave de fecha local "YYYY-MM-DD" (sin pasar por UTC, para no correr el día). */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return formatDateKey(new Date());
}

/** Ej. "lun. 13 oct. 2026". */
export function formatShortDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Suma (o resta) días a una clave "YYYY-MM-DD" respetando la hora local. */
export function addDaysToKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

/** Días entre dos claves, ambos extremos incluidos (mismo día = 1). */
export function daysBetweenInclusive(fromKey: string, toKey: string): number {
  const ms = parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime();
  return Math.round(ms / 86_400_000) + 1;
}
